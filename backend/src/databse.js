// ==========================================
// TaskFlow PostgreSQL Database Manager
// ==========================================
// Note on filename: The file is named 'databse.js' (with a slight typo) to preserve
// compatibility with imports throughout the existing codebase.
//
// This file initializes a connection pool to PostgreSQL using the 'pg' library.
// It supports reading database passwords from local environment variables or from
// mounted Docker Secrets (via DATABASE_PASSWORD_FILE), which is a production best practice.

const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

// ----------------------------------------------------
// Secret/Password Resolver
// ----------------------------------------------------
// In production, storing plain-text passwords in environment variables is discouraged.
// Instead, we use Docker Secrets to mount a temporary text file.
// If DATABASE_PASSWORD_FILE is provided, we read the password from that file.
// Otherwise, we fallback to the DATABASE_PASSWORD environment variable.
const databasePassword = process.env.DATABASE_PASSWORD_FILE
  ? fs.readFileSync(process.env.DATABASE_PASSWORD_FILE, 'utf8').trim()
  : process.env.DATABASE_PASSWORD;

// ----------------------------------------------------
// PostgreSQL Pool Configuration
// ----------------------------------------------------
// We use a Pool to manage multiple client connections efficiently instead of spinning
// up a new connection for every request.
const pool = new Pool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  user: process.env.DATABASE_USER || 'user',
  password: databasePassword,
  database: process.env.DATABASE_NAME || 'taskflow',
});

// ----------------------------------------------------
// Startup Connectivity Verification
// ----------------------------------------------------
// Test the connection pool immediately on startup by fetching the current DB server time.
// Note: If connection fails, we log it but do not terminate the process. This ensures
// the Express app can start and return a healthcheck error rather than crash loop.
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection failed:', err.message);
  } else {
    console.log(
      'Database connected successfully at:',
      res.rows[0].now
    );
  }
});

// Export helper to run queries and direct pool instance for advanced actions (e.g., closing pools in tests)
module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};