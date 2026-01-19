import { Router } from 'express';
import * as walletController from '../controllers/walletController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// GET /api/wallet - Get user's wallet summary (requires auth)
router.get('/', authenticate, walletController.getWallet);

// GET /api/wallet/email/:email - Get wallet summary by email (public, for landing page)
router.get('/email/:email', walletController.getWalletByEmail);

// GET /api/wallet/history - Get wallet transaction history (requires auth)
router.get('/history', authenticate, walletController.getWalletHistory);

export default router;
