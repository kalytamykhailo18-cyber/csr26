import { Router } from 'express';
import * as settingsController from '../controllers/settingsController.js';
import { authenticate, adminOnly } from '../middleware/auth.js';

const router = Router();

// GET /api/settings - Get all settings (public - needed for calculations)
router.get('/', settingsController.getAllSettings);

// GET /api/settings/:key - Get single setting (public)
router.get('/:key', settingsController.getSetting);

// PUT /api/settings/:key - Update setting (admin only)
router.put('/:key', authenticate, adminOnly, settingsController.updateSetting);

export default router;
