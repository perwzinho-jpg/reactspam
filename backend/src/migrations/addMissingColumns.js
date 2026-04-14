import db from '../config/database.js';

export const addMissingColumns = async () => {
  try {
    // Add display_name to zapi_instances
    const [cols1] = await db.query(`SHOW COLUMNS FROM zapi_instances LIKE 'display_name'`);
    if (cols1.length === 0) {
      await db.query(`ALTER TABLE zapi_instances ADD COLUMN display_name VARCHAR(255) NULL`);
    } else {
    }

    // Add instance_phone to campaign_numbers
    const [cols2] = await db.query(`SHOW COLUMNS FROM campaign_numbers LIKE 'instance_phone'`);
    if (cols2.length === 0) {
      await db.query(`ALTER TABLE campaign_numbers ADD COLUMN instance_phone VARCHAR(100) NULL`);
    } else {
    }

    // Add instances_used to campaigns
    const [cols3] = await db.query(`SHOW COLUMNS FROM campaigns LIKE 'instances_used'`);
    if (cols3.length === 0) {
      await db.query(`ALTER TABLE campaigns ADD COLUMN instances_used JSON NULL`);
    } else {
    }

    // Add active_instances_count to campaigns
    const [cols4] = await db.query(`SHOW COLUMNS FROM campaigns LIKE 'active_instances_count'`);
    if (cols4.length === 0) {
      await db.query(`ALTER TABLE campaigns ADD COLUMN active_instances_count INT DEFAULT 0`);
    } else {
    }

  } catch (error) {
    throw error;
  }
};
