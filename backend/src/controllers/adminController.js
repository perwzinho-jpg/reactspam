import db from '../config/database.js';

// Get all users (admin only)
export const getAllUsers = async (req, res) => {
  try {
    const [users] = await db.query(`
      SELECT
        u.id,
        u.username,
        u.email,
        u.full_name,
        u.account_type,
        u.is_active,
        u.is_banned,
        u.can_send,
        u.max_instances,
        u.created_at,
        u.last_login,
        (SELECT COUNT(*) FROM instances WHERE user_id = u.id) as instance_count,
        (SELECT COUNT(*) FROM campaigns WHERE user_id = u.id) as campaign_count,
        (SELECT SUM(sent_count) FROM campaigns WHERE user_id = u.id) as total_messages
      FROM users u
      WHERE u.id != ?
      ORDER BY u.created_at DESC
    `, [req.user.id]);

    res.json({
      success: true,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar usuários'
    });
  }
};

// Get user details (admin only)
export const getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const [users] = await db.query(`
      SELECT
        u.id,
        u.username,
        u.email,
        u.full_name,
        u.account_type,
        u.is_active,
        u.is_banned,
        u.can_send,
        u.max_instances,
        u.created_at,
        u.last_login
      FROM users u
      WHERE u.id = ?
    `, [id]);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Get user instances
    const [instances] = await db.query(`
      SELECT id, instance_name, status, phone_number, created_at
      FROM instances
      WHERE user_id = ?
      ORDER BY created_at DESC
    `, [id]);

    // Get user campaigns summary
    const [campaigns] = await db.query(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
        SUM(sent_count) as total_sent
      FROM campaigns
      WHERE user_id = ?
    `, [id]);

    res.json({
      success: true,
      user: users[0],
      instances,
      campaignStats: campaigns[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar detalhes do usuário'
    });
  }
};

// Ban/Unban user (admin only)
export const toggleBanUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { banned } = req.body;

    // Check if user exists and is not admin
    const [users] = await db.query(
      'SELECT account_type FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    if (users[0].account_type === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Não é possível banir um administrador'
      });
    }

    await db.query(
      'UPDATE users SET is_banned = ?, is_active = ? WHERE id = ?',
      [banned, !banned, id]
    );

    res.json({
      success: true,
      message: banned ? 'Usuário banido com sucesso' : 'Usuário desbanido com sucesso'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao alterar status do usuário'
    });
  }
};

// Toggle user send permission (admin only)
export const toggleSendPermission = async (req, res) => {
  try {
    const { id } = req.params;
    const { canSend } = req.body;

    const [users] = await db.query(
      'SELECT id FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    await db.query(
      'UPDATE users SET can_send = ? WHERE id = ?',
      [canSend, id]
    );

    res.json({
      success: true,
      message: canSend ? 'Envio liberado com sucesso' : 'Envio bloqueado com sucesso'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao alterar permissão de envio'
    });
  }
};

// Update user instance limit (admin only)
export const updateInstanceLimit = async (req, res) => {
  try {
    const { id } = req.params;
    const { maxInstances } = req.body;

    const [users] = await db.query(
      'SELECT id FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    await db.query(
      'UPDATE users SET max_instances = ? WHERE id = ?',
      [maxInstances, id]
    );

    res.json({
      success: true,
      message: maxInstances > 0
        ? `Limite de instâncias alterado para ${maxInstances}`
        : 'Limite de instâncias removido (ilimitado)'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao alterar limite de instâncias'
    });
  }
};

// Update user account type (admin only)
export const updateAccountType = async (req, res) => {
  try {
    const { id } = req.params;
    const { accountType } = req.body;

    if (!['free', 'active', 'admin'].includes(accountType)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de conta inválido'
      });
    }

    const [users] = await db.query(
      'SELECT id FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    await db.query(
      'UPDATE users SET account_type = ? WHERE id = ?',
      [accountType, id]
    );

    res.json({
      success: true,
      message: 'Tipo de conta alterado com sucesso'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao alterar tipo de conta'
    });
  }
};

// Get admin dashboard stats
export const getAdminStats = async (req, res) => {
  try {
    // Total users
    const [userStats] = await db.query(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN account_type = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN account_type = 'free' THEN 1 ELSE 0 END) as free,
        SUM(CASE WHEN is_banned = 1 THEN 1 ELSE 0 END) as banned,
        SUM(CASE WHEN can_send = 0 THEN 1 ELSE 0 END) as blocked
      FROM users
      WHERE account_type != 'admin'
    `);

    // Total instances
    const [instanceStats] = await db.query(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'connected' THEN 1 ELSE 0 END) as connected,
        SUM(CASE WHEN status = 'disconnected' THEN 1 ELSE 0 END) as disconnected
      FROM instances
    `);

    // Total campaigns
    const [campaignStats] = await db.query(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(sent_count) as total_sent
      FROM campaigns
    `);

    // Pending activation requests
    const [activationRequests] = await db.query(`
      SELECT COUNT(*) as pending
      FROM activation_requests
      WHERE status = 'pending'
    `);

    res.json({
      success: true,
      stats: {
        users: userStats[0],
        instances: instanceStats[0],
        campaigns: campaignStats[0],
        pendingActivations: activationRequests[0].pending
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar estatísticas'
    });
  }
};

// Get pending activation requests
export const getActivationRequests = async (req, res) => {
  try {
    const [requests] = await db.query(`
      SELECT
        ar.id,
        ar.user_id,
        ar.request_message,
        ar.status,
        ar.created_at,
        u.username,
        u.email,
        u.full_name
      FROM activation_requests ar
      JOIN users u ON ar.user_id = u.id
      WHERE ar.status = 'pending'
      ORDER BY ar.created_at ASC
    `);

    res.json({
      success: true,
      requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar solicitações'
    });
  }
};

// Process activation request
export const processActivationRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, notes } = req.body;

    if (!['approved', 'rejected'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Ação inválida'
      });
    }

    const [requests] = await db.query(
      'SELECT user_id FROM activation_requests WHERE id = ? AND status = ?',
      [id, 'pending']
    );

    if (requests.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Solicitação não encontrada ou já processada'
      });
    }

    // Update request
    await db.query(
      'UPDATE activation_requests SET status = ?, processed_at = NOW(), processed_by = ?, admin_notes = ? WHERE id = ?',
      [action, req.user.id, notes || null, id]
    );

    // If approved, update user account type
    if (action === 'approved') {
      await db.query(
        'UPDATE users SET account_type = ? WHERE id = ?',
        ['active', requests[0].user_id]
      );
    }

    res.json({
      success: true,
      message: action === 'approved' ? 'Conta ativada com sucesso' : 'Solicitação rejeitada'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao processar solicitação'
    });
  }
};

// Export all leads from all campaigns (admin only)
export const exportAllLeads = async (req, res) => {
  try {
    const { status, userId } = req.query;

    let query = `
      SELECT DISTINCT
        cn.phone_number,
        cn.var1,
        cn.var2,
        cn.var3,
        cn.var4,
        cn.var5
      FROM campaign_numbers cn
      JOIN campaigns c ON cn.campaign_id = c.id
    `;

    const params = [];

    // Filter by user if specified
    if (userId) {
      query += ' WHERE c.user_id = ?';
      params.push(userId);
    }

    // Filter by status if specified
    if (status && ['sent', 'failed', 'pending'].includes(status)) {
      query += params.length > 0 ? ' AND' : ' WHERE';
      query += ' cn.status = ?';
      params.push(status);
    }

    query += ' ORDER BY cn.phone_number';

    const [leads] = await db.query(query, params);

    if (leads.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Nenhum lead encontrado'
      });
    }

    // Build CSV
    const headers = ['Telefone', 'Var1', 'Var2', 'Var3', 'Var4', 'Var5'];
    const rows = leads.map(lead => [
      lead.phone_number,
      lead.var1 || '',
      lead.var2 || '',
      lead.var3 || '',
      lead.var4 || '',
      lead.var5 || ''
    ]);

    const csv = [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n');

    const filename = `todos-leads-${Date.now()}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache');

    res.send('\uFEFF' + csv);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao exportar leads'
    });
  }
};

// Get leads statistics (admin only)
export const getLeadsStats = async (req, res) => {
  try {
    // Total unique leads
    const [uniqueLeads] = await db.query(`
      SELECT COUNT(DISTINCT phone_number) as total
      FROM campaign_numbers
    `);

    // Total leads (with duplicates)
    const [totalLeads] = await db.query(`
      SELECT COUNT(*) as total
      FROM campaign_numbers
    `);

    // Leads by status
    const [byStatus] = await db.query(`
      SELECT
        status,
        COUNT(DISTINCT phone_number) as unique_count,
        COUNT(*) as total_count
      FROM campaign_numbers
      GROUP BY status
    `);

    // Leads by user
    const [byUser] = await db.query(`
      SELECT
        u.id,
        u.username,
        COUNT(DISTINCT cn.phone_number) as unique_leads,
        COUNT(cn.id) as total_leads
      FROM campaign_numbers cn
      JOIN campaigns c ON cn.campaign_id = c.id
      JOIN users u ON c.user_id = u.id
      GROUP BY u.id, u.username
      ORDER BY unique_leads DESC
    `);

    res.json({
      success: true,
      stats: {
        uniqueLeads: uniqueLeads[0].total,
        totalLeads: totalLeads[0].total,
        duplicates: totalLeads[0].total - uniqueLeads[0].total,
        byStatus,
        byUser
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar estatísticas de leads'
    });
  }
};
