import db from '../config/database.js';

export const addSendOrderColumn = async () => {
  try {
    // Check if column exists
    const [columns] = await db.query(`
      SHOW COLUMNS FROM campaign_numbers LIKE 'send_order'
    `);

    if (columns.length === 0) {
      // Add send_order column
      await db.query(`
        ALTER TABLE campaign_numbers
        ADD COLUMN send_order INT DEFAULT 0 AFTER id
      `);
      // Initialize send_order values based on existing IDs
      await db.query(`
        UPDATE campaign_numbers
        SET send_order = id
        WHERE send_order = 0 OR send_order IS NULL
      `);
    } else {
    }
  } catch (error) {
    throw error;
  }
};
