import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import { authenticate, adminOnly } from '../middleware/auth.js';

const router = Router();

// All routes require admin authentication
router.use(authenticate, adminOnly);

// GET /api/users - List all users
router.get('/', userController.getAllUsers);

// GET /api/users/export/csv - Export users to CSV (must be before :id route)
router.get('/export/csv', userController.exportUsersCSV);

// GET /api/users/:id - Get single user
router.get('/:id', userController.getUser);

// PUT /api/users/:id - Update user (admin)
router.put('/:id', userController.updateUser);

// POST /api/users/:id/adjust-wallet - Manually adjust user wallet (admin)
router.post('/:id/adjust-wallet', userController.adjustWallet);

export default router;
