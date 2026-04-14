import express from 'express';
import {
  getTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate
} from '../controllers/templatesController.js';
import { requireActive } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireActive, getTemplates);
router.get('/:id', requireActive, getTemplate);
router.post('/', requireActive, createTemplate);
router.put('/:id', requireActive, updateTemplate);
router.delete('/:id', requireActive, deleteTemplate);

export default router;
