const express = require("express");
const router = express.Router();
const {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  getStats,
} = require("../controllers/taskController");
const verifyToken = require("../middleware/authMiddleware");

// All task routes require authentication
router.use(verifyToken);

// GET /api/tasks/stats — dashboard statistics
router.get("/stats", getStats);

// GET /api/tasks — get all tasks
router.get("/", getTasks);

// POST /api/tasks — create task
router.post("/", createTask);

// PUT /api/tasks/:id — update task
router.put("/:id", updateTask);

// PATCH /api/tasks/:id/status — update only status
router.patch("/:id/status", updateTaskStatus);

// DELETE /api/tasks/:id — delete task
router.delete("/:id", deleteTask);

module.exports = router;
