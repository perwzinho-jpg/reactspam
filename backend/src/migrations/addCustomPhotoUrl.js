import db from '../config/database.js';

export const addCustomPhotoUrlColumn = async () => {
  try {
    // Check if column exists
    const [columns] = await db.query(`
      SHOW COLUMNS FROM instances LIKE 'custom_photo_url'
    `);

    if (columns.length === 0) {
      await db.query(`
        ALTER TABLE instances
        ADD COLUMN custom_photo_url VARCHAR(1000) NULL
      `);
    } else {
    }
  } catch (error) {
    throw error;
  }
};
