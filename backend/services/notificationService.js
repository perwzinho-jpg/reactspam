import db from '../config/database.js';

class NotificationService {
  /**
   * Create and emit a notification
   * @param {String} userId - User ID to send notification to
   * @param {String} type - Notification type (campaign, instance, system, message)
   * @param {String} title - Notification title
   * @param {String} message - Notification message
   * @param {Object} metadata - Additional metadata
   */
  static async create(userId, type, title, message, metadata = {}) {
    try {
      const [result] = await db.query(
        `INSERT INTO notifications (user_id, type, title, message, metadata)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, type, title, message, JSON.stringify(metadata)]
      );

      const notificationId = result.insertId;

      // Emit via socket.io if user is connected
      if (global.io) {
        global.io.to(`user:${userId}`).emit('notification', {
          id: notificationId,
          type,
          title,
          message,
          timestamp: new Date().toISOString(),
          read: false,
          metadata
        });
      }

      return {
        id: notificationId,
        user_id: userId,
        type,
        title,
        message,
        metadata
      };
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Create campaign notification
   */
  static async campaignCreated(userId, campaignName, campaignId) {
    return this.create(
      userId,
      'campaign',
      'Campanha criada',
      `Sua campanha "${campaignName}" foi criada com sucesso`,
      { campaignId }
    );
  }

  static async campaignStarted(userId, campaignName, campaignId) {
    return this.create(
      userId,
      'campaign',
      'Campanha iniciada',
      `Sua campanha "${campaignName}" começou a ser processada`,
      { campaignId }
    );
  }

  static async campaignCompleted(userId, campaignName, campaignId, totalSent) {
    return this.create(
      userId,
      'campaign',
      'Campanha concluída',
      `Sua campanha "${campaignName}" foi concluída. ${totalSent} mensagens enviadas`,
      { campaignId, totalSent }
    );
  }

  static async campaignFailed(userId, campaignName, campaignId, error) {
    return this.create(
      userId,
      'campaign',
      'Erro na campanha',
      `Sua campanha "${campaignName}" falhou: ${error}`,
      { campaignId, error }
    );
  }

  /**
   * Create instance notification
   */
  static async instanceConnected(userId, instanceName, instanceId) {
    return this.create(
      userId,
      'instance',
      'Instância conectada',
      `Sua instância "${instanceName}" foi conectada com sucesso`,
      { instanceId }
    );
  }

  static async instanceDisconnected(userId, instanceName, instanceId) {
    return this.create(
      userId,
      'instance',
      'Instância desconectada',
      `Sua instância "${instanceName}" foi desconectada`,
      { instanceId }
    );
  }

  static async instanceError(userId, instanceName, instanceId, error) {
    return this.create(
      userId,
      'instance',
      'Erro na instância',
      `Sua instância "${instanceName}" teve um erro: ${error}`,
      { instanceId, error }
    );
  }

  /**
   * Create system notification
   */
  static async systemUpdate(userId, title, message) {
    return this.create(
      userId,
      'system',
      title,
      message,
      {}
    );
  }

  /**
   * Create message notification
   */
  static async messageReceived(userId, from, text) {
    return this.create(
      userId,
      'message',
      'Nova mensagem recebida',
      `De ${from}: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`,
      { from, text }
    );
  }
}

export default NotificationService;
