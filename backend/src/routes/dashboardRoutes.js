import express from 'express';
import db from '../config/database.js';

const router = express.Router();

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    // Get campaigns count
    const [campaigns] = await db.query(
      'SELECT COUNT(*) as total, SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as active FROM campaigns WHERE user_id = ?',
      ['processing', req.user.id]
    );

    // Get messages sent today
    const [messagesToday] = await db.query(
      'SELECT COUNT(*) as count FROM campaign_numbers cn JOIN campaigns c ON cn.campaign_id = c.id WHERE c.user_id = ? AND DATE(cn.sent_at) = CURDATE()',
      [req.user.id]
    );

    // Get connected instances
    const [instances] = await db.query(
      'SELECT COUNT(*) as count FROM instances WHERE user_id = ? AND status = ? AND is_active = TRUE',
      [req.user.id, 'connected']
    );

    // Get templates count
    const [templates] = await db.query(
      'SELECT COUNT(*) as count FROM templates WHERE user_id = ? AND is_active = TRUE',
      [req.user.id]
    );

    // Get recent campaigns (processing first, then paused, then others by date)
    const [recentCampaigns] = await db.query(
      `SELECT c.*, t.name as template_name,
       (SELECT COUNT(*) FROM campaign_numbers WHERE campaign_id = c.id) as total_numbers
       FROM campaigns c
       LEFT JOIN templates t ON c.template_id = t.id
       WHERE c.user_id = ?
       ORDER BY
         CASE
           WHEN c.status = 'processing' THEN 1
           WHEN c.status = 'paused' THEN 2
           ELSE 3
         END,
         c.created_at DESC
       LIMIT 5`,
      [req.user.id]
    );

    res.json({
      success: true,
      stats: {
        totalCampaigns: campaigns[0].total,
        activeCampaigns: campaigns[0].active,
        messagesToday: messagesToday[0].count,
        connectedInstances: instances[0].count,
        totalTemplates: templates[0].count
      },
      recentCampaigns
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar estatísticas.'
    });
  }
});

export default router;
