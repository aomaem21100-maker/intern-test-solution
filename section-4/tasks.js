const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const ALLOWED_STATUSES = ['To Do', 'Done'];
const PAGE_SIZE = 20;

// GET: Admin เห็น Task ทั้งหมด ส่วน Employee เห็นเฉพาะ Task ที่ตนได้รับมอบหมาย
router.get('/api/tasks', authenticate, async (req, res) => {
  const rawPage = Number(req.query.page ?? 1);
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const offset = (page - 1) * PAGE_SIZE;
  const params = [];
  const conditions = [];

  if (req.query.projectId) {
    params.push(req.query.projectId);
    conditions.push(`project_id = $${params.length}`);
  }

  if (req.user.role !== 'admin') {
    params.push(req.user.id);
    conditions.push(`assigned_to = $${params.length}`);
  }

  let sql = 'SELECT * FROM tasks';
  if (conditions.length) sql += ` WHERE ${conditions.join(' AND ')}`;
  params.push(PAGE_SIZE, offset);
  sql += ` ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

  try {
    const result = await db.query(sql, params);
    return res.status(200).json({ tasks: result.rows, page });
  } catch (err) {
    console.error('GET /api/tasks failed:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// PATCH: ตรวจสิทธิ์และเปลี่ยนสถานะ พร้อมบันทึก audit log ใน transaction เดียวกัน
router.patch('/api/tasks/:id/status', authenticate, async (req, res) => {
  const taskId = Number(req.params.id);
  const { status } = req.body ?? {};

  if (!Number.isSafeInteger(taskId) || taskId <= 0) {
    return res.status(400).json({ message: 'Invalid task id' });
  }
  if (!ALLOWED_STATUSES.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  let client;
  try {
    client = await db.connect();
    await client.query('BEGIN');

    const { rows } = await client.query(
      'SELECT * FROM tasks WHERE id = $1 FOR UPDATE',
      [taskId]
    );
    const task = rows[0];
    if (!task) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Task not found' });
    }

    const isAdmin = req.user.role === 'admin';
    const isOwner = Number(task.assigned_to) === Number(req.user.id);

    if (!isAdmin && !isOwner) {
      await client.query('ROLLBACK');
      return res.status(403).json({ message: 'No permission to edit this task' });
    }

    if (!isAdmin && (task.status !== 'To Do' || status !== 'Done')) {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'Employee can only change To Do to Done' });
    }

    const updatedResult = await client.query(
      'UPDATE tasks SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, taskId]
    );
    await client.query(
      'INSERT INTO audit_log (task_id, user_id, action) VALUES ($1, $2, $3)',
      [taskId, req.user.id, `status:${status}`]
    );

    await client.query('COMMIT');
    return res.status(200).json(updatedResult.rows[0]);
  } catch (err) {
    if (client) {
      try { await client.query('ROLLBACK'); } catch (_) { /* transaction อาจจบไปแล้ว */ }
    }
    console.error('PATCH /api/tasks/:id/status failed:', err);
    return res.status(500).json({ message: 'Internal server error' });
  } finally {
    client?.release();
  }
});

// DELETE: ต้อง Login และต้องเป็น Admin เท่านั้น
router.delete('/api/tasks/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin only' });
  }

  try {
    const result = await db.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }
    return res.status(204).end();
  } catch (err) {
    console.error('DELETE /api/tasks/:id failed:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
