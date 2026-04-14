import express from 'express';
import {
  getProxys,
  createProxy,
  updateProxy,
  deleteProxy,
  toggleProxy,
  testProxy
} from '../controllers/proxysController.js';
import { requireActive } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireActive, getProxys);
router.post('/', requireActive, createProxy);
router.put('/:id', requireActive, updateProxy);
router.delete('/:id', requireActive, deleteProxy);
router.patch('/:id/toggle', requireActive, toggleProxy);
router.post('/:id/test', requireActive, testProxy);

export default router;
