import db from '../config/database.js';
import multer from 'multer';
import csvParser from 'csv-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import campaignProcessor from '../services/campaignProcessor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to ensure order column exists
const ensureOrderColumn = async () => {
  try {
    // Try to query the order column
    await db.query('SELECT `order` FROM campaign_numbers LIMIT 1');
  } catch (error) {
    // Column doesn't exist, create it
    if (error.code === 'ER_BAD_FIELD_ERROR') {
      try {
        await db.query(
          'ALTER TABLE campaign_numbers ADD COLUMN `order` INT DEFAULT NULL AFTER id'
        );
      } catch (alterError) {
        // Column might have been created by another request
        if (!alterError.message.includes('Duplicate column name')) {
        }
      }
    }
  }
};

// Configure multer for file uploads (CSV and TXT)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

export const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.csv' || ext === '.txt') {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos CSV e TXT são permitidos.'));
    }
  },
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 // 10MB
  }
});

// Get all campaigns for user
export const getCampaigns = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status; // Filter by status
    const sortBy = req.query.sortBy || 'created_at'; // Default sort column
    const sortOrder = req.query.sortOrder || 'desc'; // Default sort order

    // Validate sort column to prevent SQL injection
    const allowedSortColumns = ['id', 'status', 'created_at', 'sent_count', 'name'];
    const sortColumn = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';

    // Validate sort order
    const order = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // Build WHERE clause
    let whereClause = 'WHERE c.user_id = ?';
    const queryParams = [req.user.id];

    if (status && status !== 'all') {
      whereClause += ' AND c.status = ?';
      queryParams.push(status);
    }

    // Get total count with filter
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM campaigns c ${whereClause}`,
      queryParams
    );
    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    // Get campaigns with pagination, filtering, and sorting
    const [campaigns] = await db.query(
      `SELECT c.*, t.name as template_name,
       (SELECT COUNT(*) FROM campaign_numbers WHERE campaign_id = c.id) as total_numbers
       FROM campaigns c
       LEFT JOIN templates t ON c.template_id = t.id
       ${whereClause}
       ORDER BY c.${sortColumn} ${order}
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    res.json({
      success: true,
      campaigns,
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
      message: 'Erro ao buscar campanhas.'
    });
  }
};

// Get single campaign
export const getCampaign = async (req, res) => {
  try {
    const { id } = req.params;

    const [campaigns] = await db.query(
      `SELECT c.*, t.name as template_name
       FROM campaigns c
       LEFT JOIN templates t ON c.template_id = t.id
       WHERE c.id = ? AND c.user_id = ?`,
      [id, req.user.id]
    );

    if (campaigns.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Campanha não encontrada.'
      });
    }

    // Get total count of numbers (don't load all numbers here)
    const [countResult] = await db.query(
      'SELECT COUNT(*) as total FROM campaign_numbers WHERE campaign_id = ?',
      [id]
    );

    // Parse instances_used JSON and enrich with instance details
    let instancesUsed = [];
    try {
      if (campaigns[0].instances_used) {
        const rawInstances = typeof campaigns[0].instances_used === 'string'
          ? JSON.parse(campaigns[0].instances_used)
          : campaigns[0].instances_used;

        // Get detailed info for each instance
        if (rawInstances && rawInstances.length > 0) {
          const instanceIds = rawInstances.map(inst => inst.id);
          const placeholders = instanceIds.map(() => '?').join(',');

          const [instanceDetails] = await db.query(
            `SELECT i.id,
                    COALESCE(i.instance_name, z.instance_name, CONCAT('Instance ', i.id)) as name,
                    i.phone_number as phone,
                    i.status,
                    z.display_name as profile_name
             FROM instances i
             LEFT JOIN zapi_instances z ON i.zapi_instance_id = z.id
             WHERE i.id IN (${placeholders})`,
            instanceIds
          );

          // Merge with raw data
          instancesUsed = rawInstances.map(rawInst => {
            const details = instanceDetails.find(d => d.id === rawInst.id);
            return {
              id: rawInst.id,
              phone: details?.phone || rawInst.phone || 'N/A',
              name: details?.name || rawInst.phone || `Instance ${rawInst.id}`,
              profileName: details?.profile_name || null,
              status: details?.status || 'unknown',
              addedAt: rawInst.addedAt
            };
          });
        }
      }
    } catch (e) {
      instancesUsed = [];
    }

    res.json({
      success: true,
      campaign: {
        ...campaigns[0],
        total_numbers: countResult[0].total,
        instances_used: instancesUsed,
        active_instances_count: campaigns[0].active_instances_count || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar campanha.'
    });
  }
};

// Get campaign numbers with pagination
export const getCampaignNumbers = async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status; // Filter by status
    const search = req.query.search; // Search by phone number

    // Verify campaign ownership
    const [campaigns] = await db.query(
      'SELECT id FROM campaigns WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (campaigns.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Campanha não encontrada.'
      });
    }

    // Build WHERE clause for filters
    let whereClause = 'WHERE campaign_id = ?';
    const queryParams = [id];

    if (status && status !== 'all') {
      whereClause += ' AND status = ?';
      queryParams.push(status);
    }

    if (search && search.trim()) {
      whereClause += ' AND phone_number LIKE ?';
      queryParams.push(`%${search.trim()}%`);
    }

    // Get total count with filters
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM campaign_numbers ${whereClause}`,
      queryParams
    );
    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    // Ensure order column exists
    await ensureOrderColumn();

    // Get numbers with pagination and filters (order by order field if exists, otherwise by id)
    const [numbers] = await db.query(
      `SELECT * FROM campaign_numbers
       ${whereClause}
       ORDER BY COALESCE(\`order\`, id) ASC, id ASC
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    res.json({
      success: true,
      numbers,
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
      message: 'Erro ao buscar números da campanha.'
    });
  }
};

// Reorder campaign numbers
export const reorderNumbers = async (req, res) => {
  try {
    const { id } = req.params;
    const { numberIds } = req.body; // Array of number IDs in the new order

    if (!Array.isArray(numberIds) || numberIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Lista de IDs é obrigatória.'
      });
    }

    // Verify campaign ownership
    const [campaigns] = await db.query(
      'SELECT id FROM campaigns WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (campaigns.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Campanha não encontrada.'
      });
    }

    // Verify all numbers belong to this campaign
    const placeholders = numberIds.map(() => '?').join(',');
    const [numbers] = await db.query(
      `SELECT id FROM campaign_numbers 
       WHERE campaign_id = ? AND id IN (${placeholders})`,
      [id, ...numberIds]
    );

    if (numbers.length !== numberIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Alguns números não pertencem a esta campanha.'
      });
    }

    // Update send_order by creating a mapping
    let updateQuery = 'UPDATE campaign_numbers SET send_order = CASE id ';
    const updateValues = [];

    numberIds.forEach((numberId, index) => {
      updateQuery += `WHEN ? THEN ? `;
      updateValues.push(numberId, index + 1);
    });

    updateQuery += `END WHERE campaign_id = ? AND id IN (${placeholders})`;
    updateValues.push(id, ...numberIds);

    await db.query(updateQuery, updateValues);

    res.json({
      success: true,
      message: 'Ordem dos números atualizada com sucesso!'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao reordenar números.'
    });
  }
};

// Move number to top of campaign
export const moveNumberToTop = async (req, res) => {
  try {
    const { id, numberId } = req.params;

    // Verify campaign ownership
    const [campaigns] = await db.query(
      'SELECT id FROM campaigns WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (campaigns.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Campanha não encontrada.'
      });
    }

    // Verify number belongs to this campaign
    const [numbers] = await db.query(
      'SELECT id FROM campaign_numbers WHERE id = ? AND campaign_id = ?',
      [numberId, id]
    );

    if (numbers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Número não encontrado nesta campanha.'
      });
    }

    // Get all numbers from this campaign ordered by current send_order
    const [allNumbers] = await db.query(
      `SELECT id FROM campaign_numbers
       WHERE campaign_id = ?
       ORDER BY COALESCE(send_order, id) ASC, id ASC`,
      [id]
    );

    // Create new order with the selected number at position 1
    const reorderedIds = [
      parseInt(numberId),
      ...allNumbers.filter(n => n.id !== parseInt(numberId)).map(n => n.id)
    ];

    // Update send_order for all numbers
    let updateQuery = 'UPDATE campaign_numbers SET send_order = CASE id ';
    const updateValues = [];

    reorderedIds.forEach((id, index) => {
      updateQuery += `WHEN ? THEN ? `;
      updateValues.push(id, index + 1);
    });

    const placeholders = reorderedIds.map(() => '?').join(',');
    updateQuery += `END WHERE campaign_id = ? AND id IN (${placeholders})`;
    updateValues.push(id, ...reorderedIds);

    await db.query(updateQuery, updateValues);

    res.json({
      success: true,
      message: 'Número movido para o topo com sucesso!'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao mover número para o topo.'
    });
  }
};

// Create campaign
export const createCampaign = async (req, res) => {
  try {
    const { name, templateId, templateId2, templateId3, instanceIds, minInterval, maxInterval, batchSize, useProxy, useAntiBan, recreateNumbers } = req.body;

    if (!name || !templateId) {
      return res.status(400).json({
        success: false,
        message: 'Nome e template são obrigatórios.'
      });
    }

    if (!instanceIds || instanceIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Selecione pelo menos uma instância.'
      });
    }

    // Check for duplicate campaign created in last 30 seconds
    const [recentCampaigns] = await db.query(
      `SELECT id FROM campaigns
       WHERE user_id = ? AND name = ? AND created_at > DATE_SUB(NOW(), INTERVAL 30 SECOND)`,
      [req.user.id, name]
    );

    if (recentCampaigns.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Uma campanha com este nome foi criada recentemente. Aguarde alguns segundos.'
      });
    }

    const [result] = await db.query(
      `INSERT INTO campaigns (user_id, name, template_id, template_id_2, template_id_3,
       min_interval, max_interval, batch_size, use_proxy, use_anti_ban)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        name,
        templateId,
        templateId2 || null,
        templateId3 || null,
        minInterval || 0,
        maxInterval || 25,
        batchSize || 20,
        useProxy || false,
        useAntiBan !== false
      ]
    );

    const campaignId = result.insertId;

    // Insert campaign instances
    if (instanceIds && instanceIds.length > 0) {
      const instanceValues = instanceIds.map((instanceId, index) => [campaignId, instanceId, index]);
      await db.query(
        'INSERT INTO campaign_instances (campaign_id, instance_id, instance_order) VALUES ?',
        [instanceValues]
      );
    }

    // If recreating a campaign, add the numbers
    let numbersAdded = 0;
    if (recreateNumbers && recreateNumbers.length > 0) {
      const numberValues = recreateNumbers.map((num, index) => [
        campaignId,
        num.phone_number,
        num.var1 || null,
        num.var2 || null,
        num.var3 || null,
        num.var4 || null,
        num.var5 || null,
        'pending',
        index
      ]);

      await db.query(
        `INSERT INTO campaign_numbers (campaign_id, phone_number, var1, var2, var3, var4, var5, status, send_order)
         VALUES ?`,
        [numberValues]
      );

      // Update campaign total_numbers
      await db.query(
        'UPDATE campaigns SET total_numbers = ? WHERE id = ?',
        [recreateNumbers.length, campaignId]
      );

      numbersAdded = recreateNumbers.length;
    }

    res.status(201).json({
      success: true,
      message: numbersAdded > 0
        ? `Campanha recriada com ${numbersAdded} números!`
        : 'Campanha criada com sucesso!',
      campaignId: campaignId
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({
      success: false,
      message: `Erro ao criar campanha. (${error.code || 'UNKNOWN'})`,
      details: error.message
    });
  }
};

// Upload file (CSV or TXT)
export const uploadCSV = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum arquivo foi enviado.'
      });
    }

    // Verify campaign ownership
    const [campaigns] = await db.query(
      'SELECT id FROM campaigns WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (campaigns.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Campanha não encontrada.'
      });
    }

    const numbers = [];
    const filePath = req.file.path;
    const fileExt = path.extname(req.file.originalname).toLowerCase();

    // Process based on file type
    if (fileExt === '.txt') {
      // Process TXT file - one phone number per line
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      for (const line of lines) {
        const cleaned = line.trim();
        if (!cleaned) continue;

        const phone = cleaned.replace(/\D/g, '');
        if (phone.length >= 10) {
          numbers.push({
            phone: phone,
            var1: '',
            var2: '',
            var3: '',
            var4: '',
            var5: ''
          });
        }
      }
    } else if (fileExt === '.csv') {
      // Process CSV file
      await new Promise((resolve, reject) => {
        let firstRow = true;
        let hasHeader = false;
        let phoneColumnIndex = null;
        let nameColumnIndex = null;

        fs.createReadStream(filePath)
          .pipe(csvParser({ headers: false })) // Don't use first row as header
          .on('data', (row) => {
            // Check if first row looks like a header (contains text like "phone", "telefone", etc.)
            if (firstRow) {
              const firstRowValues = Object.values(row);
              const firstRowString = firstRowValues.join(' ').toLowerCase();
              
              // Check if first row contains header keywords
              if (firstRowString.includes('phone') || firstRowString.includes('telefone') || 
                  firstRowString.includes('numero') || firstRowString.includes('number') ||
                  firstRowString.includes('nome') || firstRowString.includes('name')) {
                hasHeader = true;
                // Find phone column index
                for (let i = 0; i < firstRowValues.length; i++) {
                  const val = String(firstRowValues[i]).toLowerCase();
                  if (val.includes('phone') || val.includes('telefone') || 
                      val.includes('numero') || val.includes('number')) {
                    phoneColumnIndex = i;
                  }
                  if (val.includes('nome') || val.includes('name')) {
                    nameColumnIndex = i;
                  }
                }
                firstRow = false;
                return; // Skip header row
              } else {
                // No header, assume first column is phone, second is name
                hasHeader = false;
                phoneColumnIndex = 0;
                nameColumnIndex = 1;
              }
              firstRow = false;
            }

            // Get values from row (using numeric indices)
            const rowValues = Object.values(row);
            let phone = null;
            let name = '';

            if (hasHeader && phoneColumnIndex !== null) {
              phone = rowValues[phoneColumnIndex];
              name = nameColumnIndex !== null ? (rowValues[nameColumnIndex] || '') : '';
            } else {
              // No header: first column = phone, second column = name
              phone = rowValues[0] || '';
              name = rowValues[1] || '';
            }

            // Clean phone number (remove all non-numeric characters including spaces)
            if (phone) {
              const cleanPhone = String(phone).replace(/\D/g, '');
              
              // Validate phone length (10-13 digits for Brazilian numbers)
              if (cleanPhone.length >= 10 && cleanPhone.length <= 13) {
                numbers.push({
                  phone: cleanPhone,
                  var1: name.trim(),
                  var2: rowValues[2] || '',
                  var3: rowValues[3] || '',
                  var4: rowValues[4] || '',
                  var5: rowValues[5] || ''
                });
              }
            }
          })
          .on('end', resolve)
          .on('error', reject);
      });
    }

    if (numbers.length === 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({
        success: false,
        message: 'Nenhum número válido encontrado no arquivo.'
      });
    }

    // Get current count and max send_order to update total
    const [currentNumbers] = await db.query(
      'SELECT COUNT(*) as count, COALESCE(MAX(send_order), 0) as max_order FROM campaign_numbers WHERE campaign_id = ?',
      [id]
    );

    let currentOrder = currentNumbers[0].max_order;

    // Insert numbers with sequential send_order
    for (const num of numbers) {
      currentOrder++;
      await db.query(
        `INSERT INTO campaign_numbers (campaign_id, phone_number, var1, var2, var3, var4, var5, send_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, num.phone, num.var1, num.var2, num.var3, num.var4, num.var5, currentOrder]
      );
    }

    // Update campaign total
    const newTotal = currentNumbers[0].count + numbers.length;
    await db.query(
      'UPDATE campaigns SET total_numbers = ? WHERE id = ?',
      [newTotal, id]
    );

    // Delete uploaded file
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      message: `${numbers.length} números importados com sucesso!`,
      count: numbers.length,
      total: newTotal
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: 'Erro ao processar arquivo.'
    });
  }
};

// Start campaign
export const startCampaign = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user can send
    const [userInfo] = await db.query(
      'SELECT can_send, is_banned FROM users WHERE id = ?',
      [req.user.id]
    );

    if (userInfo[0].is_banned) {
      return res.status(403).json({
        success: false,
        message: 'Sua conta foi banida. Entre em contato com o administrador.'
      });
    }

    if (!userInfo[0].can_send) {
      return res.status(403).json({
        success: false,
        message: 'Seu envio está bloqueado. Entre em contato com o administrador para liberar.'
      });
    }

    const [campaigns] = await db.query(
      'SELECT * FROM campaigns WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (campaigns.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Campanha não encontrada.'
      });
    }

    const campaign = campaigns[0];

    if (campaign.status === 'processing') {
      return res.status(400).json({
        success: false,
        message: 'Campanha já está em andamento.'
      });
    }

    if (campaign.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Campanha já foi concluída.'
      });
    }

    // Check if has numbers
    const [numbers] = await db.query(
      'SELECT COUNT(*) as count FROM campaign_numbers WHERE campaign_id = ?',
      [id]
    );

    if (numbers[0].count === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum número cadastrado nesta campanha.'
      });
    }

    // Check if has connected instances
    const [instances] = await db.query(
      'SELECT COUNT(*) as count FROM instances WHERE user_id = ? AND status = ? AND is_active = TRUE',
      [req.user.id, 'connected']
    );

    if (instances[0].count === 0) {
      return res.status(400).json({
        success: false,
        message: 'Você precisa ter pelo menos uma instância conectada para iniciar a campanha.',
        code: 'NO_INSTANCES'
      });
    }

    // Update campaign status
    await db.query(
      'UPDATE campaigns SET status = ?, started_at = NOW() WHERE id = ?',
      ['processing', id]
    );

    // Start processing campaign
    campaignProcessor.processCampaign(id).catch(err => {
    });

    res.json({
      success: true,
      message: 'Campanha iniciada com sucesso!'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao iniciar campanha.'
    });
  }
};

// Pause campaign
export const pauseCampaign = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      'UPDATE campaigns SET status = ?, paused_at = NOW() WHERE id = ? AND user_id = ? AND status = ?',
      ['paused', id, req.user.id, 'processing']
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: 'Não foi possível pausar a campanha.'
      });
    }

    // Emit socket event for status change
    if (global.io) {
      global.io.to(`campaign:${id}`).emit('campaign-status-changed', {
        campaignId: parseInt(id),
        status: 'paused',
        action: 'paused'
      });

      // Also emit to user room for campaigns page
      global.io.to(`user:${req.user.id}`).emit('campaign-status-changed', {
        campaignId: parseInt(id),
        status: 'paused',
        action: 'paused'
      });
    }

    res.json({
      success: true,
      message: 'Campanha pausada com sucesso!'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao pausar campanha.'
    });
  }
};

// Resume campaign
export const resumeCampaign = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if has connected instances
    const [instances] = await db.query(
      'SELECT COUNT(*) as count FROM instances WHERE user_id = ? AND status = ? AND is_active = TRUE',
      [req.user.id, 'connected']
    );

    if (instances[0].count === 0) {
      return res.status(400).json({
        success: false,
        message: 'Você precisa ter pelo menos uma instância conectada para retomar a campanha.',
        code: 'NO_INSTANCES'
      });
    }

    const [result] = await db.query(
      'UPDATE campaigns SET status = ?, paused_at = NULL WHERE id = ? AND user_id = ? AND status = ?',
      ['processing', id, req.user.id, 'paused']
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: 'Não foi possível retomar a campanha.'
      });
    }

    // Reset numbers stuck in processing status
    await db.query(
      `UPDATE campaign_numbers
       SET status = 'pending', error_message = NULL, instance_id = NULL
       WHERE campaign_id = ? AND status = 'processing'`,
      [id]
    );

    // Start processing campaign
    campaignProcessor.processCampaign(id).catch(err => {
    });

    // Emit socket event for status change
    if (global.io) {
      global.io.to(`campaign:${id}`).emit('campaign-status-changed', {
        campaignId: parseInt(id),
        status: 'processing',
        action: 'resumed'
      });

      // Also emit to user room for campaigns page
      global.io.to(`user:${req.user.id}`).emit('campaign-status-changed', {
        campaignId: parseInt(id),
        status: 'processing',
        action: 'resumed'
      });
    }

    res.json({
      success: true,
      message: 'Campanha retomada com sucesso!'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao retomar campanha.'
    });
  }
};

// Reset failed numbers to pending
export const resetFailedNumbers = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify campaign ownership
    const [campaigns] = await db.query(
      'SELECT id FROM campaigns WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (campaigns.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Campanha não encontrada.'
      });
    }

    // Reset failed numbers to pending
    const [result] = await db.query(
      `UPDATE campaign_numbers 
       SET status = 'pending', error_message = NULL, instance_id = NULL
       WHERE campaign_id = ? AND status = 'failed'`,
      [id]
    );

    // Also reset stuck processing numbers
    await db.query(
      `UPDATE campaign_numbers 
       SET status = 'pending', error_message = NULL, instance_id = NULL
       WHERE campaign_id = ? AND status = 'processing'`,
      [id]
    );

    // Update campaign counters
    await db.query(
      `UPDATE campaigns 
       SET failed_count = GREATEST(0, failed_count - ?),
           total_numbers = total_numbers
       WHERE id = ?`,
      [result.affectedRows, id]
    );

    res.json({
      success: true,
      message: `${result.affectedRows} número(s) resetado(s) com sucesso!`,
      resetCount: result.affectedRows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao resetar números falhados.'
    });
  }
};

// Cancel campaign
export const cancelCampaign = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      'UPDATE campaigns SET status = ? WHERE id = ? AND user_id = ? AND status IN (?, ?)',
      ['cancelled', id, req.user.id, 'processing', 'paused']
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: 'Não foi possível cancelar a campanha.'
      });
    }

    // Emit socket event for status change
    if (global.io) {
      global.io.to(`campaign:${id}`).emit('campaign-status-changed', {
        campaignId: parseInt(id),
        status: 'cancelled',
        action: 'cancelled'
      });

      // Also emit to user room for campaigns page
      global.io.to(`user:${req.user.id}`).emit('campaign-status-changed', {
        campaignId: parseInt(id),
        status: 'cancelled',
        action: 'cancelled'
      });
    }

    res.json({
      success: true,
      message: 'Campanha cancelada com sucesso!'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao cancelar campanha.'
    });
  }
};

// Get campaign progress
export const getCampaignProgress = async (req, res) => {
  try {
    const { id } = req.params;

    const [campaigns] = await db.query(
      'SELECT sent_count, failed_count, success_count, total_numbers, status FROM campaigns WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (campaigns.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Campanha não encontrada.'
      });
    }

    const campaign = campaigns[0];
    const processed = campaign.sent_count + campaign.failed_count;
    const progress = campaign.total_numbers > 0 ? (processed / campaign.total_numbers) * 100 : 0;

    res.json({
      success: true,
      progress: {
        total: campaign.total_numbers,
        sent: campaign.sent_count,
        failed: campaign.failed_count,
        success: campaign.success_count,
        pending: campaign.total_numbers - processed,
        percentage: Math.round(progress * 100) / 100,
        status: campaign.status
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar progresso.'
    });
  }
};

// Delete campaign
export const deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;

    // Delete campaign and cascade delete numbers
    const [result] = await db.query(
      'DELETE FROM campaigns WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Campanha não encontrada.'
      });
    }

    res.json({
      success: true,
      message: 'Campanha excluída com sucesso!'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao excluir campanha.'
    });
  }
};

// Export leads to CSV
export const exportLeads = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify campaign ownership
    const [campaigns] = await db.query(
      'SELECT id, name FROM campaigns WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (campaigns.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Campanha não encontrada.'
      });
    }

    // Get all numbers from campaign
    const [numbers] = await db.query(
      'SELECT phone_number, var1, var2, var3, var4, var5, status, sent_at FROM campaign_numbers WHERE campaign_id = ? ORDER BY id',
      [id]
    );

    if (numbers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum número encontrado nesta campanha.'
      });
    }

    // Build CSV content
    let csv = 'Telefone,Nome,Var2,Var3,Var4,Var5,Status,Enviado em\n';

    for (const num of numbers) {
      const row = [
        num.phone_number || '',
        num.var1 || '',
        num.var2 || '',
        num.var3 || '',
        num.var4 || '',
        num.var5 || '',
        num.status || 'pending',
        num.sent_at ? new Date(num.sent_at).toLocaleString('pt-BR') : ''
      ];

      // Escape commas and quotes
      const escapedRow = row.map(field => {
        const str = String(field);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      });

      csv += escapedRow.join(',') + '\n';
    }

    // Set headers for file download
    const filename = `leads-${campaigns[0].name.replace(/[^a-z0-9]/gi, '-')}-${Date.now()}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache');

    // Send CSV with BOM for Excel compatibility
    res.send('\uFEFF' + csv);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao exportar leads.'
    });
  }
};

// Export only failed numbers
export const exportFailedNumbers = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify campaign ownership
    const [campaigns] = await db.query(
      'SELECT id, name FROM campaigns WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (campaigns.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Campanha não encontrada.'
      });
    }

    // Get only failed numbers from campaign
    const [numbers] = await db.query(
      'SELECT phone_number, var1, var2, var3, var4, var5, status, sent_at FROM campaign_numbers WHERE campaign_id = ? AND status = ? ORDER BY id',
      [id, 'failed']
    );

    if (numbers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum número com falha encontrado nesta campanha.'
      });
    }

    // Build CSV content
    let csv = 'Telefone,Nome,Var2,Var3,Var4,Var5,Status,Enviado em\n';

    for (const num of numbers) {
      const row = [
        num.phone_number || '',
        num.var1 || '',
        num.var2 || '',
        num.var3 || '',
        num.var4 || '',
        num.var5 || '',
        num.status || 'failed',
        num.sent_at ? new Date(num.sent_at).toLocaleString('pt-BR') : ''
      ];

      // Escape commas and quotes
      const escapedRow = row.map(field => {
        const str = String(field);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      });

      csv += escapedRow.join(',') + '\n';
    }

    // Set headers for file download
    const filename = `falhas-${campaigns[0].name.replace(/[^a-z0-9]/gi, '-')}-${Date.now()}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache');

    // Send CSV with BOM for Excel compatibility
    res.send('\uFEFF' + csv);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao exportar números com falha.'
    });
  }
};

// Export pending numbers from campaign
export const exportPendingNumbers = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify campaign ownership
    const [campaigns] = await db.query(
      'SELECT id, name FROM campaigns WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (campaigns.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Campanha não encontrada.'
      });
    }

    // Get only pending numbers from campaign
    const [numbers] = await db.query(
      'SELECT phone_number, var1, var2, var3, var4, var5, status FROM campaign_numbers WHERE campaign_id = ? AND status = ? ORDER BY id',
      [id, 'pending']
    );

    if (numbers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum número pendente encontrado nesta campanha.'
      });
    }

    // Build CSV content
    let csv = 'Telefone,Nome,Var2,Var3,Var4,Var5,Status\n';

    for (const num of numbers) {
      const row = [
        num.phone_number || '',
        num.var1 || '',
        num.var2 || '',
        num.var3 || '',
        num.var4 || '',
        num.var5 || '',
        num.status || 'pending'
      ];

      // Escape commas and quotes
      const escapedRow = row.map(field => {
        const str = String(field);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      });

      csv += escapedRow.join(',') + '\n';
    }

    // Set headers for file download
    const filename = `pendentes-${campaigns[0].name.replace(/[^a-z0-9]/gi, '-')}-${Date.now()}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache');

    // Send CSV with BOM for Excel compatibility
    res.send('\uFEFF' + csv);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao exportar números pendentes.'
    });
  }
};

// Export sent numbers from campaign
export const exportSentNumbers = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify campaign ownership
    const [campaigns] = await db.query(
      'SELECT id, name FROM campaigns WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (campaigns.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Campanha não encontrada.'
      });
    }

    // Get only sent numbers from campaign (both sent and success statuses)
    const [numbers] = await db.query(
      'SELECT phone_number, var1, var2, var3, var4, var5, status, sent_at FROM campaign_numbers WHERE campaign_id = ? AND status IN (?, ?) ORDER BY id',
      [id, 'sent', 'success']
    );

    if (numbers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum número enviado encontrado nesta campanha.'
      });
    }

    // Build CSV content
    let csv = 'Telefone,Nome,Var2,Var3,Var4,Var5,Status,Enviado em\n';

    for (const num of numbers) {
      const row = [
        num.phone_number || '',
        num.var1 || '',
        num.var2 || '',
        num.var3 || '',
        num.var4 || '',
        num.var5 || '',
        num.status || 'sent',
        num.sent_at ? new Date(num.sent_at).toLocaleString('pt-BR') : ''
      ];

      // Escape commas and quotes
      const escapedRow = row.map(field => {
        const str = String(field);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      });

      csv += escapedRow.join(',') + '\n';
    }

    // Set headers for file download
    const filename = `enviados-${campaigns[0].name.replace(/[^a-z0-9]/gi, '-')}-${Date.now()}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache');

    // Send CSV with BOM for Excel compatibility
    res.send('\uFEFF' + csv);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao exportar números enviados.'
    });
  }
};

// Retry failed numbers by creating a new campaign
export const retryFailedNumbers = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify campaign ownership and get campaign details
    const [campaigns] = await db.query(
      'SELECT * FROM campaigns WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (campaigns.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Campanha não encontrada.'
      });
    }

    const originalCampaign = campaigns[0];

    // Get failed numbers from original campaign
    const [failedNumbers] = await db.query(
      'SELECT phone_number, var1, var2, var3, var4, var5 FROM campaign_numbers WHERE campaign_id = ? AND status = ? ORDER BY id',
      [id, 'failed']
    );

    if (failedNumbers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum número com falha encontrado para retentar.'
      });
    }

    // Create new campaign with same settings
    const [result] = await db.query(
      `INSERT INTO campaigns (
        user_id, name, template_id, template_id_2, template_id_3,
        min_interval, max_interval, batch_size, use_proxy, use_anti_ban, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        `${originalCampaign.name} - Retentativa`,
        originalCampaign.template_id,
        originalCampaign.template_id_2,
        originalCampaign.template_id_3,
        originalCampaign.min_interval,
        originalCampaign.max_interval,
        originalCampaign.batch_size,
        originalCampaign.use_proxy,
        originalCampaign.use_anti_ban,
        'pending'
      ]
    );

    const newCampaignId = result.insertId;

    // Insert failed numbers into new campaign
    for (let i = 0; i < failedNumbers.length; i++) {
      const num = failedNumbers[i];
      await db.query(
        `INSERT INTO campaign_numbers (campaign_id, phone_number, var1, var2, var3, var4, var5, status, send_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [newCampaignId, num.phone_number, num.var1, num.var2, num.var3, num.var4, num.var5, 'pending', i + 1]
      );
    }

    // Update new campaign total numbers
    await db.query(
      'UPDATE campaigns SET total_numbers = ? WHERE id = ?',
      [failedNumbers.length, newCampaignId]
    );

    res.json({
      success: true,
      message: `Nova campanha criada com ${failedNumbers.length} números que falharam!`,
      newCampaignId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao criar campanha de retentativa.'
    });
  }
};

// Add numbers manually (paste/type)
export const addNumbersManually = async (req, res) => {
  try {
    const { id } = req.params;
    const { numbers } = req.body;

    if (!numbers || typeof numbers !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Lista de números é obrigatória.'
      });
    }

    // Verify campaign ownership
    const [campaigns] = await db.query(
      'SELECT id, name, status FROM campaigns WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (campaigns.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Campanha não encontrada.'
      });
    }

    const campaign = campaigns[0];

    if (campaign.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Só é possível adicionar números em campanhas pendentes.'
      });
    }

    // Parse numbers - split by newline, comma, semicolon, or space
    let rawNumbers = numbers
      .split(/[\n,;\s]+/)
      .map(num => num.trim())
      .filter(num => num.length > 0);
    // Process and validate numbers
    const processedNumbers = new Set(); // Use Set to auto-remove duplicates
    const invalidNumbers = [];

    for (const num of rawNumbers) {
      // Remove all non-numeric characters
      const cleanNum = num.replace(/\D/g, '');

      if (!cleanNum) {
        continue; // Skip empty
      }

      // Validate length (10-13 digits for Brazilian numbers)
      if (cleanNum.length < 10 || cleanNum.length > 13) {
        invalidNumbers.push(num);
        continue;
      }

      // Format: Add 55 if needed
      let formattedNum = cleanNum;

      // If 10 or 11 digits (local Brazilian number), add country code
      if (cleanNum.length === 10 || cleanNum.length === 11) {
        formattedNum = '55' + cleanNum;
      }
      // If 12 digits and doesn't start with 55, it's likely wrong format
      else if (cleanNum.length === 12 && !cleanNum.startsWith('55')) {
        invalidNumbers.push(num);
        continue;
      }
      // If 13 digits and doesn't start with 55, it's likely wrong format
      else if (cleanNum.length === 13 && !cleanNum.startsWith('55')) {
        invalidNumbers.push(num);
        continue;
      }

      // Additional validation: Brazilian numbers with 55 should be 12-13 digits
      if (formattedNum.startsWith('55') && (formattedNum.length < 12 || formattedNum.length > 13)) {
        invalidNumbers.push(num);
        continue;
      }

      processedNumbers.add(formattedNum);
    }

    if (processedNumbers.size === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum número válido encontrado.',
        invalidNumbers: invalidNumbers.slice(0, 10) // Show first 10 invalid
      });
    }

    // Check for existing numbers in this campaign to avoid duplicates
    const numbersArray = Array.from(processedNumbers);
    const placeholders = numbersArray.map(() => '?').join(',');

    const [existing] = await db.query(
      `SELECT phone_number FROM campaign_numbers WHERE campaign_id = ? AND phone_number IN (${placeholders})`,
      [id, ...numbersArray]
    );

    const existingSet = new Set(existing.map(row => row.phone_number));
    const newNumbers = numbersArray.filter(num => !existingSet.has(num));
    if (newNumbers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Todos os números já foram adicionados nesta campanha.',
        stats: {
          total: rawNumbers.length,
          duplicates: rawNumbers.length - processedNumbers.size,
          alreadyExists: existingSet.size,
          invalid: invalidNumbers.length
        }
      });
    }

    // Get max send_order for this campaign
    const [maxOrderResult] = await db.query(
      'SELECT COALESCE(MAX(send_order), 0) as max_order FROM campaign_numbers WHERE campaign_id = ?',
      [id]
    );

    let currentOrder = maxOrderResult[0].max_order;

    // Insert new numbers with sequential send_order
    const values = newNumbers.map(num => {
      currentOrder++;
      return [id, num, 'pending', currentOrder];
    });

    await db.query(
      'INSERT INTO campaign_numbers (campaign_id, phone_number, status, send_order) VALUES ?',
      [values]
    );

    // Update campaign total_numbers
    await db.query(
      'UPDATE campaigns SET total_numbers = total_numbers + ? WHERE id = ?',
      [newNumbers.length, id]
    );
    res.json({
      success: true,
      message: `${newNumbers.length} número(s) adicionado(s) com sucesso!`,
      stats: {
        added: newNumbers.length,
        duplicatesRemoved: rawNumbers.length - processedNumbers.size,
        alreadyExists: existingSet.size,
        invalid: invalidNumbers.length,
        totalProcessed: rawNumbers.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao adicionar números.'
    });
  }
};

// Get active campaigns (processing or paused) for real-time monitor
export const getActiveCampaigns = async (req, res) => {
  try {
    // Include processing, paused, and recently completed campaigns (last 30 minutes)
    const [campaigns] = await db.query(
      `SELECT c.*, t.name as template_name,
       (SELECT COUNT(*) FROM campaign_numbers WHERE campaign_id = c.id) as total_numbers
       FROM campaigns c
       LEFT JOIN templates t ON c.template_id = t.id
       WHERE c.user_id = ? AND (
         c.status IN ('processing', 'paused')
         OR (c.status = 'completed' AND c.completed_at > DATE_SUB(NOW(), INTERVAL 30 MINUTE))
       )
       ORDER BY c.created_at DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      campaigns
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar campanhas ativas.'
    });
  }
};

// Get campaign instances
export const getCampaignInstances = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify campaign ownership
    const [campaigns] = await db.query(
      'SELECT id FROM campaigns WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (campaigns.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Campanha não encontrada.'
      });
    }

    const [instances] = await db.query(
      `SELECT ci.*, i.instance_name, i.phone_number
       FROM campaign_instances ci
       JOIN instances i ON ci.instance_id = i.id
       WHERE ci.campaign_id = ?
       ORDER BY ci.instance_order ASC`,
      [id]
    );

    res.json({
      success: true,
      instances
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar instâncias da campanha.'
    });
  }
};

// Update campaign instances
export const updateCampaignInstances = async (req, res) => {
  try {
    const { id } = req.params;
    const { instanceIds } = req.body;

    if (!instanceIds || instanceIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Selecione pelo menos uma instância.'
      });
    }

    // Verify campaign ownership
    const [campaigns] = await db.query(
      'SELECT id, status FROM campaigns WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (campaigns.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Campanha não encontrada.'
      });
    }

    const campaign = campaigns[0];

    // Only allow updating instances for pending or paused campaigns
    if (campaign.status !== 'pending' && campaign.status !== 'paused') {
      return res.status(400).json({
        success: false,
        message: 'Não é possível alterar instâncias de campanhas em andamento ou concluídas.'
      });
    }

    // Verify all instances exist and are connected
    const [instances] = await db.query(
      'SELECT id FROM instances WHERE id IN (?) AND user_id = ? AND status = ? AND is_active = TRUE',
      [instanceIds, req.user.id, 'connected']
    );

    if (instances.length !== instanceIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Algumas instâncias não estão conectadas ou não existem.'
      });
    }

    // Delete existing instances for this campaign
    await db.query('DELETE FROM campaign_instances WHERE campaign_id = ?', [id]);

    // Insert new instances with order
    const instanceValues = instanceIds.map((instanceId, index) => [id, instanceId, index]);
    await db.query(
      'INSERT INTO campaign_instances (campaign_id, instance_id, instance_order) VALUES ?',
      [instanceValues]
    );

    res.json({
      success: true,
      message: 'Instâncias atualizadas com sucesso!'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar instâncias da campanha.'
    });
  }
};

// Get campaign data for recreation
export const getCampaignForRecreate = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify campaign ownership
    const [campaigns] = await db.query(
      `SELECT c.*, t.name as template_name
       FROM campaigns c
       LEFT JOIN templates t ON c.template_id = t.id
       WHERE c.id = ? AND c.user_id = ?`,
      [id, req.user.id]
    );

    if (campaigns.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Campanha não encontrada.'
      });
    }

    const campaign = campaigns[0];

    // Get all numbers from the original campaign
    const [numbers] = await db.query(
      'SELECT phone_number, var1, var2, var3, var4, var5 FROM campaign_numbers WHERE campaign_id = ? ORDER BY id',
      [id]
    );

    // Get instances used in original campaign
    const [instances] = await db.query(
      'SELECT instance_id FROM campaign_instances WHERE campaign_id = ?',
      [id]
    );

    res.json({
      success: true,
      campaign: {
        name: campaign.name,
        template_id: campaign.template_id,
        template_name: campaign.template_name,
        use_anti_ban: campaign.use_anti_ban,
        min_interval: campaign.min_interval,
        max_interval: campaign.max_interval,
        use_proxy: campaign.use_proxy
      },
      numbers: numbers,
      instanceIds: instances.map(i => i.instance_id)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar dados da campanha.'
    });
  }
};
