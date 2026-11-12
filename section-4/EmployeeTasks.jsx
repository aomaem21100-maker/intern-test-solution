import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function EmployeeTasks() {
  const { user, token } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadTasks = async (showLoading = false) => {
      if (showLoading && active) setLoading(true);
      try {
        const data = await api.getTasks(token);
        if (active) {
          // กรองข้อมูลจาก server ซ้ำที่ UI เพื่อให้หน้า Employee แสดงเฉพาะงานของตน
          setTasks(data.tasks.filter((task) => Number(task.assigned_to) === Number(user.id)));
          setError('');
        }
      } catch (err) {
        if (active) setError('โหลดข้อมูลไม่สำเร็จ');
      } finally {
        if (showLoading && active) setLoading(false);
      }
    };

    loadTasks(true);
    const intervalId = window.setInterval(() => loadTasks(false), 10000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [token, user.id]);

  const visible = useMemo(
    () => tasks.filter((task) => filter === 'All' || task.status === filter),
    [tasks, filter]
  );

  const markDone = async (task) => {
    if (task.status !== 'To Do' || savingId !== null) return;
    setError('');
    setSavingId(task.id);

    // Optimistic update: เปลี่ยนทันที แต่ rollback หาก server ปฏิเสธหรือเกิด error
    setTasks((current) => current.map((item) =>
      item.id === task.id ? { ...item, status: 'Done' } : item
    ));

    try {
      const savedTask = await api.updateStatus(token, task.id, 'Done');
      setTasks((current) => current.map((item) =>
        item.id === task.id ? savedTask : item
      ));
    } catch (err) {
      setTasks((current) => current.map((item) =>
        item.id === task.id ? { ...item, status: task.status } : item
      ));
      setError('อัปเดตไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="page">
      <select value={filter} onChange={(e) => setFilter(e.target.value)}>
        <option>All</option>
        <option>To Do</option>
        <option>Done</option>
      </select>

      {loading && <p>กำลังโหลด...</p>}
      {error && <p className="error">{error}</p>}

      <ul>
        {visible.map((task) => (
          <li key={task.id}>
            {task.title} — {task.status}
            {task.status === 'To Do' && (
              <button disabled={savingId !== null} onClick={() => markDone(task)}>
                {savingId === task.id ? 'กำลังบันทึก...' : 'เปลี่ยนเป็น Done'}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
