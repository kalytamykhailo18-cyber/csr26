import { Router } from 'express';
import * as merchantController from '../controllers/merchantController.js';
import { authenticate, merchantOrAdmin, adminOnly } from '../middleware/auth.js';

const router = Router();

// ============================================
// MERCHANT SELF-SERVICE ENDPOINTS (/me routes)
// NOTE: These MUST be defined BEFORE /:id routes
// ============================================

// GET /api/merchants/me - Get current merchant dashboard (self-service)
router.get('/me', authenticate, merchantOrAdmin, merchantController.getCurrentMerchant);

// GET /api/merchants/me/transactions - Get current merchant's transactions
router.get('/me/transactions', authenticate, merchantOrAdmin, merchantController.getMyTransactions);

// GET /api/merchants/me/billing - Get current merchant's billing info
router.get('/me/billing', authenticate, merchantOrAdmin, merchantController.getMyBilling);

// GET /api/merchants/me/invoices/:invoiceId - Get invoice details
router.get('/me/invoices/:invoiceId', authenticate, merchantOrAdmin, merchantController.getMyInvoice);

// GET /api/merchants/me/skus - Get merchant's SKU configurations
router.get('/me/skus', authenticate, merchantOrAdmin, merchantController.getMySKUs);

// ============================================
// ADMIN ENDPOINTS
// ============================================

// GET /api/merchants - List all merchants (admin only)
router.get('/', authenticate, adminOnly, merchantController.getAllMerchants);

// POST /api/merchants - Create new merchant (admin only)
router.post('/', authenticate, adminOnly, merchantController.createMerchant);

// PUT /api/merchants/:id - Update merchant (admin only)
router.put('/:id', authenticate, adminOnly, merchantController.updateMerchant);

// ============================================
// MERCHANT OR ADMIN ENDPOINTS (by ID)
// ============================================

// GET /api/merchants/:id - Get merchant by ID (merchant or admin)
router.get('/:id', authenticate, merchantOrAdmin, merchantController.getMerchant);

// GET /api/merchants/:id/transactions - Get merchant transactions (merchant or admin)
router.get('/:id/transactions', authenticate, merchantOrAdmin, merchantController.getMerchantTransactions);

// GET /api/merchants/:id/billing - Get merchant billing info (merchant or admin)
router.get('/:id/billing', authenticate, merchantOrAdmin, merchantController.getMerchantBilling);

export default router;
