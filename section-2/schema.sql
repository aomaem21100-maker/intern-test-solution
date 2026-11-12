-- PostgreSQL schema สำหรับ Project Access Control
CREATE TABLE users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'employee')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE projects (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    created_by BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tasks (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    assigned_to BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status VARCHAR(10) NOT NULL DEFAULT 'To Do'
        CHECK (status IN ('To Do', 'Done')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_log (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    action VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- รองรับหน้า Employee ที่ค้นหา Task ของผู้ใช้และเรียงตามเวลาสร้าง
CREATE INDEX idx_tasks_assigned_created
    ON tasks (assigned_to, created_at DESC);

-- รองรับหน้า Admin ที่กรอง Task ตาม project และเรียงตามเวลาสร้าง
CREATE INDEX idx_tasks_project_created
    ON tasks (project_id, created_at DESC);

-- รองรับการเปิดประวัติการเปลี่ยนแปลงของ Task ตามลำดับเวลา
CREATE INDEX idx_audit_log_task_created
    ON audit_log (task_id, created_at DESC);
