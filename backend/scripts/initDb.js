import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

async function run() {
  try {
    const sqlPath = path.resolve('src', 'config', 'database.sql');
    const sql = await fs.promises.readFile(sqlPath, 'utf-8');

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'es_turbo',
      port: process.env.DB_PORT || 3306,
      multipleStatements: true // allow running entire file at once
    });

    console.log('Running database initialization script...');
    await connection.query(sql);
    console.log('Database schema applied successfully.');

    // optionally insert a default admin if none exist
    const [admins] = await connection.query(
      "SELECT id FROM users WHERE account_type = 'admin' LIMIT 1"
    );
    if (admins.length === 0) {
      const defaultAdmin = {
        username: process.env.DEFAULT_ADMIN_USERNAME || 'admin',
        email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com',
        password: process.env.DEFAULT_ADMIN_PASSWORD || 'password123',
        fullName: process.env.DEFAULT_ADMIN_FULLNAME || 'Administrator'
      };

      const hashed = await bcrypt.hash(defaultAdmin.password, 10);
      await connection.query(
        'INSERT INTO users (username, email, password, full_name, account_type) VALUES (?, ?, ?, ?, ?)',
        [
          defaultAdmin.username,
          defaultAdmin.email,
          hashed,
          defaultAdmin.fullName,
          'admin'
        ]
      );
      console.log(`Default admin created -> username: ${defaultAdmin.username} password: ${defaultAdmin.password}`);
      console.log('Change these credentials after first login!');
    }

    await connection.end();
  } catch (err) {
    console.error(`Failed to initialize database: ${err.message} (Code: ${err.code})`);
    // Exit with 0 so the server can at least try to start and report its own DB connection errors,
    // or keep process.exit(1) but now we can see the actual error message clearly.
    process.exit(1);
  }
}

run();
