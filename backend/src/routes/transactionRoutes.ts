import { Router } from 'express';
import * as transactionController from '../controllers/transactionController.js';
import { authenticate, optionalAuth, adminOnly } from '../middleware/auth.js';

const router = Router();

// POST /api/transactions - Create new transaction (from landing page)
router.post('/', optionalAuth, transactionController.createTransaction);

// GET /api/transactions - List user's transactions (requires auth)
router.get('/', authenticate, transactionController.getUserTransactions);

// GET /api/transactions/all - List all transactions (admin only)
router.get('/all', authenticate, adminOnly, transactionController.getAllTransactions);

// GET /api/transactions/:id - Get single transaction
router.get('/:id', authenticate, transactionController.getTransaction);

export default router;
