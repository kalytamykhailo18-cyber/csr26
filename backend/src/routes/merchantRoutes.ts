import { Router } from 'express';
import * as merchantController from '../controllers/merchantController.js';
import { authenticate, merchantOrAdmin, adminOnly } from '../middleware/auth.js';

const router = Router();

// GET /api/merchants - List all merchants (admin only)
router.get('/', authenticate, adminOnly, merchantController.getAllMerchants);

// GET /api/merchants/:id - Get merchant by ID (merchant or admin)
router.get('/:id', authenticate, merchantOrAdmin, merchantController.getMerchant);

// GET /api/merchants/:id/transactions - Get merchant transactions (merchant or admin)
router.get('/:id/transactions', authenticate, merchantOrAdmin, merchantController.getMerchantTransactions);

// GET /api/merchants/:id/billing - Get merchant billing info (merchant or admin)
router.get('/:id/billing', authenticate, merchantOrAdmin, merchantController.getMerchantBilling);

// POST /api/merchants - Create new merchant (admin only)
router.post('/', authenticate, adminOnly, merchantController.createMerchant);

// PUT /api/merchants/:id - Update merchant (admin only)
router.put('/:id', authenticate, adminOnly, merchantController.updateMerchant);

export default router;
