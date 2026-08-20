const express = require('express');
const cors = require('cors');
require('dotenv').config();

const taskRoutes = require('./routes/taskRoutes');
const db = require('./databse');

const app = express();
const PORT = process.env.PORT || 9001;

// Enable CORS
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Built-in body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the TaskFlow API' });
});

// General API Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'TaskFlow API is healthy',
    timestamp: new Date().toISOString()
  });
});

// Database Health Check
app.get('/api/db-health', async (req, res) => {
  try {
    // Run simple query to check DB availability
    await db.query('SELECT 1');
    res.status(200).json({
      success: true,
      message: 'Database is healthy and connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database is unhealthy or disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API Routes
app.use('/api/tasks', taskRoutes);

// 404 Not Found handler
app.use((req, res, next) => {
  res.status(404).json({ error: 'Route not found' });
});

// Generic 500 Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'An internal server error occurred' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
