import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/register - Create new user (from landing page form)
router.post('/register', authController.register);

// POST /api/auth/magic-link - Send magic link email
router.post('/magic-link', authController.sendMagicLink);

// GET /api/auth/verify/:token - Verify magic link token
router.get('/verify/:token', authController.verifyMagicLink);

// GET /api/auth/me - Get current user (requires auth)
router.get('/me', authenticate, authController.getCurrentUser);

// POST /api/auth/admin-login - Admin login via secret code (from landing page)
router.post('/admin-login', authController.adminLogin);

export default router;
