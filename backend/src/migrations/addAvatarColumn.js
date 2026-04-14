import db from '../config/database.js';

export const addAvatarColumn = async () => {
  try {
    // Check if column exists
    const [columns] = await db.query(`
      SHOW COLUMNS FROM users LIKE 'avatar'
    `);

    if (columns.length === 0) {
      await db.query(`
        ALTER TABLE users
        ADD COLUMN avatar VARCHAR(500) NULL
      `);
    } else {
    }
  } catch (error) {
    throw error;
  }
};
