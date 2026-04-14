import db from '../config/database.js';
import axios from 'axios';

// Get all proxys for user
export const getProxys = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;

    // Get total count
    const [countResult] = await db.query(
      'SELECT COUNT(*) as total FROM proxies WHERE user_id = ?',
      [req.user.id]
    );
    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    // Get proxys with pagination
    const [proxys] = await db.query(
      'SELECT * FROM proxies WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [req.user.id, limit, offset]
    );

    res.json({
      success: true,
      proxys,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar proxys.'
    });
  }
};

// Create proxy
export const createProxy = async (req, res) => {
  try {
    const { name, host, port, username, password, type } = req.body;

    if (!name || !host || !port || !type) {
      return res.status(400).json({
        success: false,
        message: 'Nome, host, porta e tipo são obrigatórios.'
      });
    }

    // Validate port
    const portNum = parseInt(port);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      return res.status(400).json({
        success: false,
        message: 'Porta inválida.'
      });
    }

    // Check if proxy already exists for this user
    const [existing] = await db.query(
      'SELECT id FROM proxies WHERE user_id = ? AND host = ? AND port = ?',
      [req.user.id, host, portNum]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Este proxy já está cadastrado.'
      });
    }

    // Insert proxy
    await db.query(
      'INSERT INTO proxies (user_id, name, host, port, username, password, type, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, name, host, portNum, username || null, password || null, type, true]
    );

    res.json({
      success: true,
      message: 'Proxy criado com sucesso!'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao criar proxy.'
    });
  }
};

// Update proxy
export const updateProxy = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, host, port, username, password, type } = req.body;

    if (!name || !host || !port || !type) {
      return res.status(400).json({
        success: false,
        message: 'Nome, host, porta e tipo são obrigatórios.'
      });
    }

    // Validate port
    const portNum = parseInt(port);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      return res.status(400).json({
        success: false,
        message: 'Porta inválida.'
      });
    }

    // Verify ownership
    const [proxies] = await db.query(
      'SELECT id FROM proxies WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (proxies.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Proxy não encontrado.'
      });
    }

    // Update proxy
    await db.query(
      'UPDATE proxies SET name = ?, host = ?, port = ?, username = ?, password = ?, type = ? WHERE id = ?',
      [name, host, portNum, username || null, password || null, type, id]
    );

    res.json({
      success: true,
      message: 'Proxy atualizado com sucesso!'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar proxy.'
    });
  }
};

// Delete proxy
export const deleteProxy = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify ownership
    const [proxies] = await db.query(
      'SELECT id FROM proxies WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (proxies.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Proxy não encontrado.'
      });
    }

    // Delete proxy
    await db.query('DELETE FROM proxies WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Proxy excluído com sucesso!'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao excluir proxy.'
    });
  }
};

// Toggle proxy active status
export const toggleProxy = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify ownership
    const [proxies] = await db.query(
      'SELECT id, is_active FROM proxies WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (proxies.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Proxy não encontrado.'
      });
    }

    const proxy = proxies[0];
    const newStatus = !proxy.is_active;

    // Update status
    await db.query(
      'UPDATE proxies SET is_active = ? WHERE id = ?',
      [newStatus, id]
    );

    res.json({
      success: true,
      message: newStatus ? 'Proxy ativado!' : 'Proxy desativado!'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao alterar status do proxy.'
    });
  }
};

// Test proxy connection
export const testProxy = async (req, res) => {
  try {
    const { id } = req.params;

    // Get proxy
    const [proxies] = await db.query(
      'SELECT * FROM proxies WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (proxies.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Proxy não encontrado.'
      });
    }

    const proxy = proxies[0];

    // Build proxy config
    const proxyConfig = {
      host: proxy.host,
      port: proxy.port,
      protocol: proxy.type
    };

    if (proxy.username && proxy.password) {
      proxyConfig.auth = {
        username: proxy.username,
        password: proxy.password
      };
    }

    // Test connection with timeout
    try {
      const response = await axios.get('https://api.ipify.org?format=json', {
        proxy: proxyConfig,
        timeout: 10000
      });

      res.json({
        success: true,
        message: 'Proxy funcionando!',
        ip: response.data.ip
      });
    } catch (testError) {
      throw new Error('Falha ao conectar com o proxy');
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Erro ao testar proxy.'
    });
  }
};
