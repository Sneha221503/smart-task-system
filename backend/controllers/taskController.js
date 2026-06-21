const pool = require("../config/db");

// GET all tasks (with optional filters)
const getTasks = async (req, res) => {
  try {
    const { status, priority, category } = req.query;
    let query = "SELECT * FROM tasks WHERE user_id = $1";
    const params = [req.user.id];
    let paramCount = 1;

    if (status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(status);
    }
    if (priority) {
      paramCount++;
      query += ` AND priority = $${paramCount}`;
      params.push(priority);
    }
    if (category) {
      paramCount++;
      query += ` AND category = $${paramCount}`;
      params.push(category);
    }

    query += " ORDER BY created_at DESC";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("GetTasks error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// POST create a new task
const createTask = async (req, res) => {
  const { title, description, priority, category, due_date } = req.body;

  if (!title) {
    return res.status(400).json({ message: "Task title is required." });
  }

  try {
    const result = await pool.query(
      `INSERT INTO tasks (user_id, title, description, priority, category, due_date)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        req.user.id,
        title,
        description || null,
        priority || "medium",
        category || null,
        due_date || null,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("CreateTask error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// PUT update a task fully
const updateTask = async (req, res) => {
  const { id } = req.params;
  const { title, description, priority, category, due_date, status } = req.body;

  try {
    const result = await pool.query(
      `UPDATE tasks
       SET title=$1, description=$2, priority=$3, category=$4,
           due_date=$5, status=$6, updated_at=NOW()
       WHERE id=$7 AND user_id=$8
       RETURNING *`,
      [title, description, priority, category, due_date, status, id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Task not found." });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("UpdateTask error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// DELETE a task
const deleteTask = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM tasks WHERE id=$1 AND user_id=$2 RETURNING *",
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Task not found." });
    }

    res.json({ message: "Task deleted successfully." });
  } catch (err) {
    console.error("DeleteTask error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// PATCH update only status
const updateTaskStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ["todo", "in_progress", "done"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status value." });
  }

  try {
    const result = await pool.query(
      "UPDATE tasks SET status=$1, updated_at=NOW() WHERE id=$2 AND user_id=$3 RETURNING *",
      [status, id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Task not found." });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("UpdateStatus error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// GET dashboard stats
const getStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const [total, todo, inProgress, done, overdue] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM tasks WHERE user_id=$1", [userId]),
      pool.query("SELECT COUNT(*) FROM tasks WHERE user_id=$1 AND status='todo'", [userId]),
      pool.query("SELECT COUNT(*) FROM tasks WHERE user_id=$1 AND status='in_progress'", [userId]),
      pool.query("SELECT COUNT(*) FROM tasks WHERE user_id=$1 AND status='done'", [userId]),
      pool.query(
        "SELECT COUNT(*) FROM tasks WHERE user_id=$1 AND due_date < NOW() AND status != 'done'",
        [userId]
      ),
    ]);

    res.json({
      total: parseInt(total.rows[0].count),
      todo: parseInt(todo.rows[0].count),
      in_progress: parseInt(inProgress.rows[0].count),
      done: parseInt(done.rows[0].count),
      overdue: parseInt(overdue.rows[0].count),
    });
  } catch (err) {
    console.error("GetStats error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

module.exports = { getTasks, createTask, updateTask, deleteTask, updateTaskStatus, getStats };
