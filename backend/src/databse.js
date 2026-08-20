const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

const databasePassword = process.env.DATABASE_PASSWORD_FILE
  ? fs.readFileSync(process.env.DATABASE_PASSWORD_FILE, 'utf8').trim()
  : process.env.DATABASE_PASSWORD;

const pool = new Pool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  user: process.env.DATABASE_USER || 'user',
  password: databasePassword,
  database: process.env.DATABASE_NAME || 'taskflow',
});

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

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};