-- =============================================
-- SmartFlow Task System — Database Setup
-- PostgreSQL मध्ये हे run करा: smart_task_db
-- =============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(150) UNIQUE NOT NULL,
  password   VARCHAR(255) NOT NULL,
  reset_password_token VARCHAR(255),
  reset_password_expires TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  status      VARCHAR(20)  DEFAULT 'todo'   CHECK (status IN ('todo', 'in_progress', 'done')),
  priority    VARCHAR(10)  DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  category    VARCHAR(100),
  due_date    DATE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster user-specific queries
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status  ON tasks(status);

-- Verify
SELECT 'Tables created successfully! ✅' AS message;
