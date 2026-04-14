import db from '../config/database.js';
import bcrypt from 'bcryptjs';

// Get user profile
export async function getProfile(req, res) {
  try {
    const [users] = await db.query(
      'SELECT id, username, email, account_type, avatar, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    res.json({
      success: true,
      user: users[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar perfil'
    });
  }
}

// Get user stats
export async function getStats(req, res) {
  try {
    // Get total campaigns
    const [campaignsResult] = await db.query(
      'SELECT COUNT(*) as count FROM campaigns WHERE user_id = ?',
      [req.user.id]
    );

    // Get total messages sent
    const [messagesResult] = await db.query(
      `SELECT SUM(sent_count) as total FROM campaigns WHERE user_id = ?`,
      [req.user.id]
    );

    // Get user creation date
    const [userResult] = await db.query(
      'SELECT created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json({
      success: true,
      stats: {
        totalCampaigns: campaignsResult[0].count || 0,
        totalMessages: messagesResult[0].total || 0,
        accountCreated: userResult[0].created_at,
        lastLogin: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar estatísticas'
    });
  }
}

// Update password only
export async function updatePassword(req, res) {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Senha atual e nova senha são obrigatórias'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'A nova senha deve ter no mínimo 6 caracteres'
      });
    }

    // Get current password
    const [users] = await db.query(
      'SELECT password FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Verify old password
    const isValidPassword = await bcrypt.compare(oldPassword, users[0].password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Senha atual incorreta'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await db.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, req.user.id]
    );

    res.json({
      success: true,
      message: 'Senha alterada com sucesso'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao alterar senha'
    });
  }
}

// Update avatar
export async function updateAvatar(req, res) {
  try {
    const { avatar } = req.body;

    await db.query(
      'UPDATE users SET avatar = ? WHERE id = ?',
      [avatar, req.user.id]
    );

    const [users] = await db.query(
      'SELECT id, username, email, account_type, avatar, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json({
      success: true,
      user: users[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar avatar'
    });
  }
}

// Update username only (full_name is not in the table, so we'll just update username)
export async function updateProfile(req, res) {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Nome de usuário é obrigatório'
      });
    }

    // Check if username is already taken by another user
    const [existingUsers] = await db.query(
      'SELECT id FROM users WHERE username = ? AND id != ?',
      [username, req.user.id]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Nome de usuário já está em uso'
      });
    }

    await db.query(
      'UPDATE users SET username = ? WHERE id = ?',
      [username, req.user.id]
    );

    const [users] = await db.query(
      'SELECT id, username, email, account_type, avatar, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json({
      success: true,
      user: users[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar perfil'
    });
  }
}
