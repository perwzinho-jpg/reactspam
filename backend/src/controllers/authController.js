import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/database.js';

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Register new user
export const register = async (req, res) => {
  try {
    const { username, email, password, fullName } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Por favor, preencha todos os campos obrigatórios.'
      });
    }

    // Check if user already exists
    const [existingUsers] = await db.query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Usuário ou email já cadastrado.'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // determine account type
    let accountType = 'active';

    // if there are no admins yet, make the first registered user an admin automatically
    const [existingAdmins] = await db.query(
      'SELECT id FROM users WHERE account_type = ?',
      ['admin']
    );
    if (existingAdmins.length === 0) {
      accountType = 'admin';
    }

    // allow using an admin code (e.g. set ADMIN_CODE in env) to create additional admins
    if (req.body.adminCode) {
      if (req.body.adminCode === process.env.ADMIN_CODE) {
        accountType = 'admin';
      } else {
        return res.status(401).json({
          success: false,
          message: 'Código de administrador inválido.'
        });
      }
    }

    // Insert user
    const [result] = await db.query(
      'INSERT INTO users (username, email, password, full_name, account_type) VALUES (?, ?, ?, ?, ?)',
      [username, email, hashedPassword, fullName || username, accountType]
    );

    const token = generateToken(result.insertId);

    res.status(201).json({
      success: true,
      message: 'Conta criada com sucesso!',
      token,
      user: {
        id: result.insertId,
        username,
        email,
        fullName: fullName || username,
        accountType // will be 'active' or 'admin' (first user or with code)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao criar conta.'
    });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Por favor, preencha todos os campos.'
      });
    }

    // Find user
    const [users] = await db.query(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, username]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas.'
      });
    }

    const user = users[0];

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas.'
      });
    }

    // Check if account is active
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Sua conta foi desativada. Entre em contato com o suporte.'
      });
    }

    // Update last login
    await db.query(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [user.id]
    );

    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Login realizado com sucesso!',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        accountType: user.account_type
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao fazer login.'
    });
  }
};

// Get current user
export const getCurrentUser = async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, username, email, full_name, account_type, created_at, last_login FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado.'
      });
    }

    const user = users[0];

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        accountType: user.account_type,
        createdAt: user.created_at,
        lastLogin: user.last_login
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar dados do usuário.'
    });
  }
};

// Request activation
export const requestActivation = async (req, res) => {
  try {
    const { message } = req.body;

    // Check if already has pending request
    const [existing] = await db.query(
      'SELECT id FROM activation_requests WHERE user_id = ? AND status = ?',
      [req.user.id, 'pending']
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Você já possui uma solicitação pendente.'
      });
    }

    // Create activation request
    await db.query(
      'INSERT INTO activation_requests (user_id, request_message, status) VALUES (?, ?, ?)',
      [req.user.id, message || 'Solicitação de ativação de conta', 'pending']
    );

    res.json({
      success: true,
      message: 'Solicitação enviada com sucesso! Aguarde aprovação.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao enviar solicitação.'
    });
  }
};
