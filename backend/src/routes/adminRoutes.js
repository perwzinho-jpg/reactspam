import express from 'express';
import { requireAdmin } from '../middleware/auth.js';
import {
  getAllUsers,
  getUserDetails,
  toggleBanUser,
  toggleSendPermission,
  updateInstanceLimit,
  updateAccountType,
  getAdminStats,
  getActivationRequests,
  processActivationRequest,
  exportAllLeads,
  getLeadsStats
} from '../controllers/adminController.js';

const router = express.Router();

// All routes require admin
router.use(requireAdmin);

// Admin dashboard stats
router.get('/stats', getAdminStats);

// Leads management
router.get('/leads/stats', getLeadsStats);
router.get('/leads/export', exportAllLeads);

// User management
router.get('/users', getAllUsers);
router.get('/users/:id', getUserDetails);
router.put('/users/:id/ban', toggleBanUser);
router.put('/users/:id/send-permission', toggleSendPermission);
router.put('/users/:id/instance-limit', updateInstanceLimit);
router.put('/users/:id/account-type', updateAccountType);

// Activation requests
router.get('/activation-requests', getActivationRequests);
router.put('/activation-requests/:id', processActivationRequest);

export default router;
