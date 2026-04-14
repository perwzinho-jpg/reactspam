import express from 'express';
import {
  getCampaigns,
  getActiveCampaigns,
  getCampaign,
  getCampaignNumbers,
  getCampaignInstances,
  updateCampaignInstances,
  reorderNumbers,
  moveNumberToTop,
  createCampaign,
  uploadCSV,
  upload,
  startCampaign,
  pauseCampaign,
  resumeCampaign,
  cancelCampaign,
  getCampaignProgress,
  deleteCampaign,
  exportLeads,
  exportFailedNumbers,
  exportPendingNumbers,
  exportSentNumbers,
  retryFailedNumbers,
  addNumbersManually,
  resetFailedNumbers,
  getCampaignForRecreate
} from '../controllers/campaignsController.js';
import { requireActive } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireActive, getCampaigns);
router.get('/active', requireActive, getActiveCampaigns);
// Specific routes must come before generic :id routes
router.get('/:id/numbers', requireActive, getCampaignNumbers);
router.get('/:id/recreate', requireActive, getCampaignForRecreate);
router.get('/:id/instances', requireActive, getCampaignInstances);
router.put('/:id/instances', requireActive, updateCampaignInstances);
router.post('/:id/numbers/reorder', requireActive, reorderNumbers);
router.post('/:id/numbers/:numberId/move-to-top', requireActive, moveNumberToTop);
router.get('/:id', requireActive, getCampaign);
router.post('/', requireActive, createCampaign);
router.post('/:id/upload', requireActive, upload.single('file'), uploadCSV);
router.post('/:id/add-numbers', requireActive, addNumbersManually);
router.post('/:id/start', requireActive, startCampaign);
router.post('/:id/pause', requireActive, pauseCampaign);
router.post('/:id/resume', requireActive, resumeCampaign);
router.post('/:id/reset-failed', requireActive, resetFailedNumbers);
router.post('/:id/cancel', requireActive, cancelCampaign);
router.get('/:id/progress', requireActive, getCampaignProgress);
router.get('/:id/export', requireActive, exportLeads);
router.get('/:id/export-failed', requireActive, exportFailedNumbers);
router.get('/:id/export-pending', requireActive, exportPendingNumbers);
router.get('/:id/export-sent', requireActive, exportSentNumbers);
router.post('/:id/retry-failed', requireActive, retryFailedNumbers);
router.delete('/:id', requireActive, deleteCampaign);

export default router;
