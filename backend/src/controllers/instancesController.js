import db from '../config/database.js';
import zapi from '../utils/zapi.js';

// Get all instances for user
export const getInstances = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get total count
    const [countResult] = await db.query(
      'SELECT COUNT(*) as total FROM instances WHERE user_id = ? AND is_active = TRUE',
      [req.user.id]
    );
    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    // Get instances with pagination
    const [instances] = await db.query(
      `SELECT i.*, z.instance_id, z.instance_token, z.client_token
       FROM instances i
       LEFT JOIN zapi_instances z ON i.zapi_instance_id = z.id
       WHERE i.user_id = ? AND i.is_active = TRUE
       ORDER BY i.created_at DESC
       LIMIT ? OFFSET ?`,
      [req.user.id, limit, offset]
    );

    res.json({
      success: true,
      instances,
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
      message: 'Erro ao buscar instâncias.'
    });
  }
};

// Get single instance
export const getInstance = async (req, res) => {
  try {
    const { id } = req.params;

    const [instances] = await db.query(
      `SELECT i.*, z.instance_id, z.instance_token
       FROM instances i
       LEFT JOIN zapi_instances z ON i.zapi_instance_id = z.id
       WHERE i.id = ? AND i.user_id = ?`,
      [id, req.user.id]
    );

    if (instances.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Instância não encontrada.'
      });
    }

    res.json({
      success: true,
      instance: instances[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar instância.'
    });
  }
};

// Create new instance
export const createInstance = async (req, res) => {
  try {
    const { instanceName, instanceId, instanceToken, clientToken } = req.body;

    // Validate all required fields
    if (!instanceName || !instanceId || !instanceToken || !clientToken) {
      return res.status(400).json({
        success: false,
        message: 'Nome, ID, Token da instância e Client Token são obrigatórios. Cada instância deve ter valores únicos.'
      });
    }

    // Validate that fields are not empty strings
    if (!instanceName.trim() || !instanceId.trim() || !instanceToken.trim() || !clientToken.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Todos os campos são obrigatórios e não podem estar vazios.'
      });
    }

    // Check instance limit for user
    const [userInfo] = await db.query(
      'SELECT max_instances FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!userInfo || userInfo.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado.'
      });
    }

    if (userInfo[0].max_instances > 0) {
      const [instanceCount] = await db.query(
        'SELECT COUNT(*) as count FROM instances WHERE user_id = ? AND is_active = TRUE',
        [req.user.id]
      );

      if (instanceCount[0].count >= userInfo[0].max_instances) {
        return res.status(403).json({
          success: false,
          message: `Você atingiu o limite máximo de ${userInfo[0].max_instances} instância(s). Entre em contato com o administrador.`
        });
      }
    }

    // Check if this user already has an instance with this instance_id
    const [userInstances] = await db.query(
      `SELECT i.id 
       FROM instances i
       JOIN zapi_instances z ON i.zapi_instance_id = z.id
       WHERE i.user_id = ? AND z.instance_id = ? AND i.is_active = TRUE`,
      [req.user.id, instanceId]
    );

    if (userInstances.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Você já possui uma instância com este Instance ID. Cada instância deve ter um ID único.'
      });
    }

    // Check if Z-API instance exists (globally)
    let [zapiInstances] = await db.query(
      'SELECT id FROM zapi_instances WHERE instance_id = ?',
      [instanceId]
    );

    let zapiInstanceId;

    if (zapiInstances.length === 0) {
      // Create new Z-API instance
      const [result] = await db.query(
        'INSERT INTO zapi_instances (instance_id, instance_token, client_token, instance_name) VALUES (?, ?, ?, ?)',
        [instanceId, instanceToken, clientToken, instanceName]
      );
      zapiInstanceId = result.insertId;
    } else {
      // Instance ID already exists globally - this means another user is using it
      // We should not allow this, each instance must be unique
      return res.status(400).json({
        success: false,
        message: 'Este Instance ID já está em uso por outra instância. Cada instância deve ter um ID, Token e Client Token únicos.'
      });
    }

    // Create user instance
    const [result] = await db.query(
      'INSERT INTO instances (user_id, zapi_instance_id, instance_name, status) VALUES (?, ?, ?, ?)',
      [req.user.id, zapiInstanceId, instanceName, 'pending']
    );

    res.status(201).json({
      success: true,
      message: 'Instância criada com sucesso!',
      instanceId: result.insertId
    });
  } catch (error) {
    console.error('Error creating instance:', error);
    // Include error code to help debugging
    const errorCode = error.code || error.errno || 'UNKNOWN';
    res.status(500).json({
      success: false,
      message: `Erro ao criar instância. (${errorCode})`,
      details: error.message
    });
  }
};

// Get QR Code for connection
export const getQRCode = async (req, res) => {
  try {
    const { id } = req.params;

    const [instances] = await db.query(
      `SELECT z.instance_id, z.instance_token, z.client_token
       FROM instances i
       JOIN zapi_instances z ON i.zapi_instance_id = z.id
       WHERE i.id = ? AND i.user_id = ?`,
      [id, req.user.id]
    );

    if (instances.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Instância não encontrada.'
      });
    }

    const { instance_id, instance_token, client_token } = instances[0];
    const result = await zapi.getQRCode(instance_id, instance_token, client_token);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      qrCode: result.qrCode
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao obter QR Code.'
    });
  }
};

// Get Phone Code (Pair Code) for connection
export const getPhoneCode = async (req, res) => {
  try {
    const { id } = req.params;
    const { phone } = req.query;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Número de telefone é obrigatório.'
      });
    }

    // Remove any non-digit characters except +
    const cleanPhone = phone.replace(/[^\d+]/g, '');

    const [instances] = await db.query(
      `SELECT z.instance_id, z.instance_token, z.client_token
       FROM instances i
       JOIN zapi_instances z ON i.zapi_instance_id = z.id
       WHERE i.id = ? AND i.user_id = ?`,
      [id, req.user.id]
    );

    if (instances.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Instância não encontrada.'
      });
    }

    const { instance_id, instance_token, client_token } = instances[0];
    const result = await zapi.getPhoneCode(instance_id, instance_token, cleanPhone, client_token);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      code: result.code
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao obter código de telefone.'
    });
  }
};

// Check instance status
export const checkStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const [instances] = await db.query(
      `SELECT i.id, i.zapi_instance_id, z.instance_id, z.instance_token, z.client_token
       FROM instances i
       JOIN zapi_instances z ON i.zapi_instance_id = z.id
       WHERE i.id = ? AND i.user_id = ?`,
      [id, req.user.id]
    );

    if (instances.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Instância não encontrada.'
      });
    }

    const { instance_id, instance_token, client_token, zapi_instance_id } = instances[0];
    const result = await zapi.checkStatus(instance_id, instance_token, client_token);

    if (result.success && result.connected) {
      // Update instance status
      await db.query(
        `UPDATE instances SET status = ?, phone_number = ?, connected_at = NOW()
         WHERE id = ?`,
        ['connected', result.phone, id]
      );

      // Update zapi_instances with phone and display_name (pushname)
      if (result.pushname) {
        await db.query(
          `UPDATE zapi_instances SET phone_number = ?, display_name = ? WHERE id = ?`,
          [result.phone, result.pushname, zapi_instance_id]
        );
      } else {
        await db.query(
          `UPDATE zapi_instances SET phone_number = ? WHERE id = ?`,
          [result.phone, zapi_instance_id]
        );
      }
    } else {
      await db.query(
        'UPDATE instances SET status = ? WHERE id = ?',
        ['disconnected', id]
      );
    }

    res.json({
      success: true,
      connected: result.connected,
      phone: result.phone,
      status: result.connected ? 'connected' : 'disconnected'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar status.'
    });
  }
};

// Disconnect instance
export const disconnectInstance = async (req, res) => {
  try {
    const { id } = req.params;

    const [instances] = await db.query(
      `SELECT z.instance_id, z.instance_token, z.client_token
       FROM instances i
       JOIN zapi_instances z ON i.zapi_instance_id = z.id
       WHERE i.id = ? AND i.user_id = ?`,
      [id, req.user.id]
    );

    if (instances.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Instância não encontrada.'
      });
    }

    const { instance_id, instance_token, client_token } = instances[0];
    const result = await zapi.disconnect(instance_id, instance_token, client_token);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error || 'Erro ao desconectar instância.'
      });
    }

    // Update status
    await db.query(
      'UPDATE instances SET status = ? WHERE id = ?',
      ['disconnected', id]
    );

    res.json({
      success: true,
      message: 'Instância desconectada com sucesso!'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao desconectar instância.'
    });
  }
};

// Update instance
export const updateInstance = async (req, res) => {
  try {
    const { id } = req.params;
    const { instanceName, instanceId, instanceToken, clientToken, resetWarmup } = req.body;

    // Verify ownership
    const [instances] = await db.query(
      `SELECT i.*, z.id as zapi_id
       FROM instances i
       JOIN zapi_instances z ON i.zapi_instance_id = z.id
       WHERE i.id = ? AND i.user_id = ?`,
      [id, req.user.id]
    );

    if (instances.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Instância não encontrada.'
      });
    }

    const instance = instances[0];

    // Update instance name if provided
    if (instanceName) {
      await db.query(
        'UPDATE instances SET instance_name = ? WHERE id = ?',
        [instanceName, id]
      );
    }

    // Reset warmup and message counters if requested
    if (resetWarmup) {
      await db.query(
        `UPDATE instances SET
         warmup_phase = 1,
         warmup_messages_sent = 0,
         messages_sent_today = 0,
         messages_sent_hour = 0,
         last_message_time = NULL
         WHERE id = ?`,
        [id]
      );
    }

    // Update Z-API instance settings if provided
    const zapiUpdateFields = [];
    const zapiUpdateValues = [];

    if (instanceId) {
      zapiUpdateFields.push('instance_id = ?');
      zapiUpdateValues.push(instanceId);
    }

    if (instanceToken) {
      zapiUpdateFields.push('instance_token = ?');
      zapiUpdateValues.push(instanceToken);
    }

    if (clientToken) {
      zapiUpdateFields.push('client_token = ?');
      zapiUpdateValues.push(clientToken);
    }

    if (zapiUpdateFields.length > 0) {
      zapiUpdateValues.push(instance.zapi_id);
      await db.query(
        `UPDATE zapi_instances SET ${zapiUpdateFields.join(', ')} WHERE id = ?`,
        zapiUpdateValues
      );
    }

    res.json({
      success: true,
      message: resetWarmup
        ? 'Instância atualizada e contadores resetados!'
        : 'Instância atualizada com sucesso!'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar instância.'
    });
  }
};

// Delete instance
export const deleteInstance = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      'UPDATE instances SET is_active = FALSE WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Instância não encontrada.'
      });
    }

    res.json({
      success: true,
      message: 'Instância excluída com sucesso!'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao excluir instância.'
    });
  }
};

// Get WhatsApp profile info
export const getProfileInfo = async (req, res) => {
  try {
    const { id } = req.params;
    // Get instance (including custom_photo_url)
    const [instances] = await db.query(
      `SELECT i.*, z.instance_id, z.instance_token, z.client_token, i.custom_photo_url
       FROM instances i
       LEFT JOIN zapi_instances z ON i.zapi_instance_id = z.id
       WHERE i.id = ? AND i.user_id = ? AND i.status = 'connected'`,
      [id, req.user.id]
    );

    if (instances.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Instância não encontrada ou não está conectada.'
      });
    }

    const instance = instances[0];

    // Validate instance_id and instance_token
    if (!instance.instance_id || !instance.instance_token) {
      return res.status(400).json({
        success: false,
        message: 'Instância não possui credenciais válidas para acessar o WhatsApp'
      });
    }

    // Get profile from Z-API, passing custom photo URL if available
    try {
      const profileData = await zapi.getProfile(
        instance.instance_id,
        instance.instance_token,
        instance.client_token,
        instance.custom_photo_url // Pass custom URL to use as priority
      );

      if (!profileData) {
        return res.status(404).json({
          success: false,
          message: 'Perfil não encontrado no WhatsApp'
        });
      }
      // Save pushname (display_name) and phone to zapi_instances table
      if (instance.zapi_instance_id) {
        try {
          await db.query(
            `UPDATE zapi_instances
             SET display_name = ?, phone_number = ?
             WHERE id = ?`,
            [profileData.pushname, profileData.phone, instance.zapi_instance_id]
          );
        } catch (dbError) {
        }
      }

      // Set no-cache headers to prevent browser caching
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      });

      res.json({
        success: true,
        profile: profileData
      });
    } catch (zapiError) {
      const errorMessage = zapiError.message || 'Erro ao obter perfil do WhatsApp';
      res.status(400).json({
        success: false,
        message: errorMessage
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar perfil.'
    });
  }
};

// Update WhatsApp profile
export const updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status, photo } = req.body;

    // Get instance
    const [instances] = await db.query(
      `SELECT i.*, z.instance_id, z.instance_token, z.client_token
       FROM instances i
       LEFT JOIN zapi_instances z ON i.zapi_instance_id = z.id
       WHERE i.id = ? AND i.user_id = ? AND i.status = 'connected'`,
      [id, req.user.id]
    );

    if (instances.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Instância não encontrada ou não está conectada.'
      });
    }

    const instance = instances[0];
    
    // Validate instance_id and instance_token
    if (!instance.instance_id || !instance.instance_token) {
      return res.status(400).json({
        success: false,
        message: 'Instância não possui credenciais válidas para acessar o WhatsApp'
      });
    }

    const updates = [];
    const errors = [];

    // Update name
    if (name && name.trim()) {
      try {
        await zapi.updateProfileName(instance.instance_id, instance.instance_token, name.trim(), instance.client_token);
        updates.push('nome');
      } catch (error) {
        errors.push(`Erro ao atualizar nome: ${error.message}`);
      }
    }

    // Update status (can be empty string to clear)
    if (status !== undefined && status !== null) {
      try {
        await zapi.updateProfileStatus(instance.instance_id, instance.instance_token, status, instance.client_token);
        updates.push('status');
      } catch (error) {
        errors.push(`Erro ao atualizar status: ${error.message}`);
      }
    }

    // Update photo
    if (photo) {
      try {
        // Update photo on WhatsApp
        const result = await zapi.updateProfilePhoto(instance.instance_id, instance.instance_token, photo, instance.client_token);
        // SAVE THE URL IN DATABASE (so we always show this URL, not WhatsApp's)
        try {
          // Save the URL (only if it's a public URL, not base64)
          if (photo.startsWith('http')) {
            await db.query(
              'UPDATE instances SET custom_photo_url = ? WHERE id = ?',
              [photo, id]
            );
          } else {
          }
        } catch (dbError) {
        }

        updates.push('foto');
      } catch (error) {
        errors.push(`Erro ao atualizar foto: ${error.message}`);
      }
    }

    // Check if any update was attempted
    const attemptedUpdates = (name && name.trim() ? 1 : 0) + 
                           (status !== undefined && status !== null ? 1 : 0) + 
                           (photo ? 1 : 0);

    if (attemptedUpdates === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nenhuma atualização foi fornecida.'
      });
    }

    if (updates.length === 0 && errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: errors.join('; ')
      });
    }

    // Return success even if some updates failed
    const message = updates.length > 0 
      ? `Perfil atualizado: ${updates.join(', ')}${errors.length > 0 ? `. Avisos: ${errors.join('; ')}` : ''}`
      : `Nenhuma atualização bem-sucedida. Erros: ${errors.join('; ')}`;

    res.json({
      success: updates.length > 0,
      message: message,
      updates: updates,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar perfil.'
    });
  }
};

