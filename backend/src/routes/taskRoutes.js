// ==========================================
// TaskFlow Backend Router: Tasks Endpoints
// ==========================================
// This router defines standard CRUD routes for 'tasks' resource, delegating the logic
// to the respective controller actions.
// All endpoints are relative to the root URL pattern registered in server.js (/api/tasks).

const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');

// ----------------------------------------------------
// CRUD Routes Configuration
// ----------------------------------------------------

// GET /api/tasks - Retrieve all tasks (supports query parameter status filter)
router.get('/', taskController.getTasks);

// GET /api/tasks/:id - Retrieve details of a single task by its UUID
router.get('/:id', taskController.getTaskById);

// POST /api/tasks - Create a new task (expects title and optional description in payload)
router.post('/', taskController.createTask);

// PUT /api/tasks/:id - Update attributes of a specific task (title, description, status)
router.put('/:id', taskController.updateTask);

// DELETE /api/tasks/:id - Remove a specific task from database
router.delete('/:id', taskController.deleteTask);

module.exports = router;
