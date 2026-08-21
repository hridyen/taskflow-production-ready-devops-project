// ==========================================
// TaskFlow Backend Controller: Tasks
// ==========================================
// This controller contains the core business logic for executing database operations.
// Crucial features implemented:
// 1. Data mapping (DB snake_case fields mapped to CamelCase API responses).
// 2. Strict UUID format validations to prevent Postgres syntax crash when supplying wrong formats.
// 3. Dynamic SQL updates where only specified fields are written.
// 4. Secure SQL parameterization ($1, $2) to completely eliminate SQL injection vectors.

const db = require('../databse');

// ----------------------------------------------------
// GET /api/tasks (Retrieve all tasks)
// ----------------------------------------------------
// Accepts query parameter 'status' (?status=completed) to filter tasks.
const getTasks = async (req, res, next) => {
  try {
    const { status } = req.query;
    let queryText = 'SELECT * FROM tasks';
    const params = [];

    // Apply conditional status filters to the database query
    if (status) {
      queryText += ' WHERE status = $1';
      params.push(status);
    }

    queryText += ' ORDER BY created_at DESC';

    // Execute query with parameterized values
    const result = await db.query(queryText, params);
    
    // Convert DB schema format (snake_case) to client convention (camelCase)
    const formattedTasks = result.rows.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      createdAt: task.created_at,
      updatedAt: task.updated_at
    }));

    res.json(formattedTasks);
  } catch (error) {
    // Propagate error to global Express error handler
    next(error);
  }
};

// ----------------------------------------------------
// GET /api/tasks/:id (Retrieve task by ID)
// ----------------------------------------------------
const getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Regular expression validation: checks if ID matches valid UUID format.
    // If not validated beforehand, Postgres throws a fatal query parser exception (500)
    // rather than letting the application return a clean 400 Bad Request.
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({ error: 'Invalid task ID format' });
    }

    const result = await db.query('SELECT * FROM tasks WHERE id = $1', [id]);
    
    // Check if task exists in database
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = result.rows[0];
    res.json({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      createdAt: task.created_at,
      updatedAt: task.updated_at
    });
  } catch (error) {
    next(error);
  }
};

// ----------------------------------------------------
// POST /api/tasks (Create a new task)
// ----------------------------------------------------
const createTask = async (req, res, next) => {
  try {
    const { title, description } = req.body;

    // Validate request constraints
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // Default tasks are created with a status of 'pending'
    const queryText = `
      INSERT INTO tasks (title, description, status)
      VALUES ($1, $2, 'pending')
      RETURNING *
    `;
    const result = await db.query(queryText, [title, description || '']);
    
    const task = result.rows[0];
    res.status(201).json({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      createdAt: task.created_at,
      updatedAt: task.updated_at
    });
  } catch (error) {
    next(error);
  }
};

// ----------------------------------------------------
// PUT /api/tasks/:id (Update task properties)
// ----------------------------------------------------
// Supports updating partial sets of fields (title, description, status).
const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, status } = req.body;

    // Validate ID before issuing SQL queries
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({ error: 'Invalid task ID format' });
    }

    // Validate state transition limits if 'status' field is passed
    if (status !== undefined) {
      const validStatuses = ['pending', 'in-progress', 'completed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
      }
    }

    // Dynamically build UPDATE query depending on fields provided in the body payload.
    // This avoids overwriting fields with undefined/null.
    const fields = [];
    const values = [];
    let idx = 1;

    if (title !== undefined) {
      fields.push(`title = $${idx++}`);
      values.push(title);
    }
    if (description !== undefined) {
      fields.push(`description = $${idx++}`);
      values.push(description);
    }
    if (status !== undefined) {
      fields.push(`status = $${idx++}`);
      values.push(status);
    }

    // If payload is empty, fetch the original task details and return them
    if (fields.length === 0) {
      const result = await db.query('SELECT * FROM tasks WHERE id = $1', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }
      const task = result.rows[0];
      return res.json({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        createdAt: task.created_at,
        updatedAt: task.updated_at
      });
    }

    // Append ID as final parameter value in dynamically constructed list
    values.push(id);
    const queryText = `
      UPDATE tasks 
      SET ${fields.join(', ')} 
      WHERE id = $${idx} 
      RETURNING *
    `;

    const result = await db.query(queryText, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = result.rows[0];
    res.json({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      createdAt: task.created_at,
      updatedAt: task.updated_at
    });
  } catch (error) {
    next(error);
  }
};

// ----------------------------------------------------
// DELETE /api/tasks/:id (Delete task)
// ----------------------------------------------------
const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate ID before executing SQL
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({ error: 'Invalid task ID format' });
    }

    const result = await db.query('DELETE FROM tasks WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully', id });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask
};
