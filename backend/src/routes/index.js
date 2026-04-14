import express from 'express';
import authRoutes from './authRoutes.js';
import templatesRoutes from './templatesRoutes.js';
import instancesRoutes from './instancesRoutes.js';
import campaignsRoutes from './campaignsRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import proxysRoutes from './proxysRoutes.js';
import notificationsRoutes from './notifications.js';
import userRoutes from './userRoutes.js';
import adminRoutes from './adminRoutes.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.use('/auth', authRoutes);

// Protected routes
router.use('/templates', authenticate, templatesRoutes);
router.use('/instances', authenticate, instancesRoutes);
router.use('/campaigns', authenticate, campaignsRoutes);
router.use('/dashboard', authenticate, dashboardRoutes);
router.use('/proxys', authenticate, proxysRoutes);
router.use('/notifications', authenticate, notificationsRoutes);
router.use('/user', authenticate, userRoutes);
router.use('/admin', authenticate, adminRoutes);

export default router;
