import db from '../config/database.js';

// Get all templates for user
export const getTemplates = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get total count
    const [countResult] = await db.query(
      'SELECT COUNT(*) as total FROM templates WHERE user_id = ? AND is_active = TRUE',
      [req.user.id]
    );
    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    // Get templates with pagination
    const [templates] = await db.query(
      'SELECT * FROM templates WHERE user_id = ? AND is_active = TRUE ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [req.user.id, limit, offset]
    );

    res.json({
      success: true,
      templates,
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
      message: 'Erro ao buscar templates.'
    });
  }
};

// Get single template
export const getTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    const [templates] = await db.query(
      'SELECT * FROM templates WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (templates.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Template não encontrado.'
      });
    }

    res.json({
      success: true,
      template: templates[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar template.'
    });
  }
};

// Create template
export const createTemplate = async (req, res) => {
  try {
    const { name, title, message, footer, buttonLabel, buttonUrl, imageUrl } = req.body;

    // Validation
    if (!name || !message) {
      return res.status(400).json({
        success: false,
        message: 'Nome e mensagem são obrigatórios.'
      });
    }

    const [result] = await db.query(
      `INSERT INTO templates (user_id, name, title, message, footer, button_label, button_url, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, name, title, message, footer, buttonLabel, buttonUrl, imageUrl]
    );

    res.status(201).json({
      success: true,
      message: 'Template criado com sucesso!',
      templateId: result.insertId
    });
  } catch (error) {
    console.error('Error creating template:', error);
    const errorCode = error.code || error.errno || 'UNKNOWN';
    res.status(500).json({
      success: false,
      message: `Erro ao criar template. (${errorCode})`,
      details: error.message
    });
  }
};

// Update template
export const updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, title, message, footer, buttonLabel, buttonUrl, imageUrl } = req.body;

    // Check if template exists and belongs to user
    const [existing] = await db.query(
      'SELECT id FROM templates WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Template não encontrado.'
      });
    }

    await db.query(
      `UPDATE templates SET name = ?, title = ?, message = ?, footer = ?,
       button_label = ?, button_url = ?, image_url = ?, updated_at = NOW()
       WHERE id = ? AND user_id = ?`,
      [name, title, message, footer, buttonLabel, buttonUrl, imageUrl, id, req.user.id]
    );

    res.json({
      success: true,
      message: 'Template atualizado com sucesso!'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar template.'
    });
  }
};

// Delete template
export const deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    // Soft delete
    const [result] = await db.query(
      'UPDATE templates SET is_active = FALSE WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Template não encontrado.'
      });
    }

    res.json({
      success: true,
      message: 'Template excluído com sucesso!'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao excluir template.'
    });
  }
};

// Process template variables
export const processTemplate = (template, variables) => {
  let processed = {
    title: template.title || '',
    message: template.message || '',
    footer: template.footer || '',
    buttonLabel: template.button_label || '',
    buttonUrl: template.button_url || '',
    imageUrl: template.image_url || ''
  };

  // Replace variables {{var1}} through {{var5}}
  for (let i = 1; i <= 5; i++) {
    const varName = `var${i}`;
    const varValue = variables[varName] || '';
    const regex = new RegExp(`\\{\\{${varName}\\}\\}`, 'g');

    processed.title = processed.title.replace(regex, varValue);
    processed.message = processed.message.replace(regex, varValue);
    processed.footer = processed.footer.replace(regex, varValue);
    processed.buttonLabel = processed.buttonLabel.replace(regex, varValue);
    processed.buttonUrl = processed.buttonUrl.replace(regex, varValue);
  }

  return processed;
};
