import db from '../config/database.js';

// Get user notifications
export async function getNotifications(req, res) {
  try {
    const [notifications] = await db.query(
      `SELECT * FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.user.id]
    );

    res.json({
      success: true,
      notifications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar notificações'
    });
  }
}

// Mark notification as read
export async function markAsRead(req, res) {
  try {
    const [result] = await db.query(
      `UPDATE notifications
       SET \`read\` = TRUE
       WHERE id = ? AND user_id = ?`,
      [req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notificação não encontrada'
      });
    }

    const [notifications] = await db.query(
      'SELECT * FROM notifications WHERE id = ?',
      [req.params.id]
    );

    res.json({
      success: true,
      notification: notifications[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao marcar notificação como lida'
    });
  }
}

// Mark all notifications as read
export async function markAllAsRead(req, res) {
  try {
    await db.query(
      `UPDATE notifications
       SET \`read\` = TRUE
       WHERE user_id = ? AND \`read\` = FALSE`,
      [req.user.id]
    );

    res.json({
      success: true,
      message: 'Todas as notificações foram marcadas como lidas'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao marcar todas como lidas'
    });
  }
}

// Delete notification
export async function deleteNotification(req, res) {
  try {
    const [result] = await db.query(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notificação não encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Notificação excluída'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao excluir notificação'
    });
  }
}

// Get unread count
export async function getUnreadCount(req, res) {
  try {
    const [result] = await db.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND `read` = FALSE',
      [req.user.id]
    );

    res.json({
      success: true,
      count: result[0].count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao contar notificações não lidas'
    });
  }
}
