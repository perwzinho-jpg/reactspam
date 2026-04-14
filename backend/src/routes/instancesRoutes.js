import express from 'express';
import {
  getInstances,
  getInstance,
  createInstance,
  updateInstance,
  getQRCode,
  getPhoneCode,
  checkStatus,
  disconnectInstance,
  deleteInstance,
  getProfileInfo,
  updateProfile
} from '../controllers/instancesController.js';

const router = express.Router();

router.get('/', getInstances);
router.post('/', createInstance);

// Specific routes must come before generic :id routes
router.get('/:id/qrcode', getQRCode);
router.get('/:id/phone-code', getPhoneCode);
router.get('/:id/status', checkStatus);
router.get('/:id/profile', getProfileInfo);
router.put('/:id/profile', updateProfile);
router.post('/:id/disconnect', disconnectInstance);

// Generic routes
router.get('/:id', getInstance);
router.put('/:id', updateInstance);
router.delete('/:id', deleteInstance);

export default router;
