// ==========================================
// TaskFlow Express API Server Entrypoint
// ==========================================
// This is the core entrypoint for the backend Node.js API application.
// It configures middleware, defines health check endpoints, loads route controllers,
// and manages global error-handling lifecycles.

const express = require('express');
const cors = require('cors');
const client = require('prom-client'); // Import prom-client
require('dotenv').config(); // Load environment variables from .env file

const taskRoutes = require('./routes/taskRoutes');
const db = require('./databse'); // Import database configuration

const app = express();
// Default port is set to 9001. This is exposed in the Docker container and proxied by Nginx
const PORT = process.env.PORT || 9001;

// ----------------------------------------------------
// Prometheus Metrics Setup
// ----------------------------------------------------
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// Define custom metrics
const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});
register.registerMetric(httpRequestDurationSeconds);

// Request duration middleware
app.use((req, res, next) => {
  const start = process.hrtime();
  res.on('finish', () => {
    const duration = process.hrtime(start);
    const durationInSeconds = duration[0] + duration[1] / 1e9;
    
    // Avoid scraping loop pollution
    if (req.path !== '/metrics') {
      const route = req.route ? req.route.path : req.path;
      httpRequestDurationSeconds
        .labels(req.method, route || req.path, res.statusCode)
        .observe(durationInSeconds);
    }
  });
  next();
});

// ----------------------------------------------------
// Global Middleware Config
// ----------------------------------------------------

// Configure Cross-Origin Resource Sharing (CORS) options
// Allows controlled requests from our frontend application (specified in CORS_ORIGIN)
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Built-in JSON body parser middleware to parse incoming request payloads
app.use(express.json());
// Built-in urlencoded parser to support HTML form submissions if needed
app.use(express.urlencoded({ extended: true }));

// ----------------------------------------------------
// Core & Health Check Endpoints
// ----------------------------------------------------

// Root route: provides basic entrypoint verification
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the TaskFlow API' });
});

// General API Health Check: used by monitoring tools to check container status
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'TaskFlow API is healthy',
    timestamp: new Date().toISOString()
  });
});

// Database Health Check: verifies Postgres availability by executing a simple query.
// This endpoint is critical for the Docker Compose healthcheck definition
app.get('/api/db-health', async (req, res) => {
  try {
    // Run simple query to check DB connectivity
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

// Prometheus Metrics endpoint - internally queried by Prometheus scraper
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err);
  }
});

// ----------------------------------------------------
// API Route Handlers
// ----------------------------------------------------
// All CRUD task endpoints are prefixed with /api/tasks
app.use('/api/tasks', taskRoutes);

// ----------------------------------------------------
// Error Handling Middleware
// ----------------------------------------------------

// Catch-all: 404 Route Not Found handler
app.use((req, res, next) => {
  res.status(404).json({ error: 'Route not found' });
});

// Generic 500: Server Error handler to intercept uncaught errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'An internal server error occurred' });
});

// ----------------------------------------------------
// Server Startup (Conditional execution)
// ----------------------------------------------------
// We wrap app.listen in a module check so that it ONLY starts listening when run directly.
// This allows the test suite to import 'app' without spinning up the network listener or DB pool.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

// Export the app instance for the unit test runner
module.exports = app;
