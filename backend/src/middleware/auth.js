import jwt from 'jsonwebtoken';
import db from '../config/database.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Acesso negado. Token não fornecido.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [users] = await db.query(
      'SELECT id, username, email, full_name, account_type, is_active, is_banned, can_send, max_instances FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado.'
      });
    }

    const user = users[0];

    if (!user.is_active || user.is_banned) {
      return res.status(403).json({
        success: false,
        message: user.is_banned ? 'Sua conta foi banida. Entre em contato com o administrador.' : 'Conta desativada.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido.'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado.'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Erro ao autenticar.'
    });
  }
};

export const requireActive = (req, res, next) => {
  if (req.user.account_type === 'free') {
    return res.status(403).json({
      success: false,
      message: 'Você precisa de uma conta ativa para acessar este recurso.'
    });
  }
  next();
};

export const requireAdmin = (req, res, next) => {
  if (req.user.account_type !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado. Apenas administradores.'
    });
  }
  next();
};
