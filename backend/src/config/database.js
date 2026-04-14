import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'es_turbo',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: '+00:00'
});

// Test connection
pool.getConnection()
  .then(connection => {
    connection.release();
  })
  .catch(err => {
    console.error('Database connection test failed:', err.message);
    if (err.code === 'ER_BAD_DB_ERROR') {
      console.error('The specified database does not exist. Run `npm run init-db` to create it.');
    } else if (err.code === 'ECONNREFUSED') {
      console.error('Cannot connect to the MySQL server. Is it running and are the env vars correct?');
    }
  });

export default pool;
