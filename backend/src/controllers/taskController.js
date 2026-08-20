const db = require('../databse');

// Get all tasks (with optional status filtering)
const getTasks = async (req, res, next) => {
  try {
    const { status } = req.query;
    let queryText = 'SELECT * FROM tasks';
    const params = [];

    if (status) {
      queryText += ' WHERE status = $1';
      params.push(status);
    }

    queryText += ' ORDER BY created_at DESC';

    const result = await db.query(queryText, params);
    
    // Map database fields to camelCase to match previous API contract
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
    next(error);
  }
};

// Get a single task by ID
const getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if valid UUID format to avoid Postgres syntax error
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({ error: 'Invalid task ID format' });
    }

    const result = await db.query('SELECT * FROM tasks WHERE id = $1', [id]);
    
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

// Create a new task
const createTask = async (req, res, next) => {
  try {
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

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

// Update an existing task
const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, status } = req.body;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({ error: 'Invalid task ID format' });
    }

    // Validate status if provided
    if (status !== undefined) {
      const validStatuses = ['pending', 'in-progress', 'completed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
      }
    }

    // Build dynamic update
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

    if (fields.length === 0) {
      // Nothing to update, return the current task
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

// Delete a task
const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;

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
