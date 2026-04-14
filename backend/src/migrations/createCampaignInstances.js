import db from '../config/database.js';

export const createCampaignInstancesTable = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS campaign_instances (
        id INT AUTO_INCREMENT PRIMARY KEY,
        campaign_id INT NOT NULL,
        instance_id INT NOT NULL,
        \`order\` INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
        FOREIGN KEY (instance_id) REFERENCES instances(id) ON DELETE CASCADE,
        UNIQUE KEY unique_campaign_instance (campaign_id, instance_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  } catch (error) {
    throw error;
  }
};
