import express from 'express';
import {
  getProfile,
  getStats,
  updatePassword,
  updateAvatar,
  updateProfile
} from '../controllers/userController.js';

const router = express.Router();

// Get user profile
router.get('/profile', getProfile);

// Get user stats
router.get('/stats', getStats);

// Update password
router.put('/password', updatePassword);

// Update avatar
router.put('/avatar', updateAvatar);

// Update profile (username only)
router.put('/profile', updateProfile);

export default router;
