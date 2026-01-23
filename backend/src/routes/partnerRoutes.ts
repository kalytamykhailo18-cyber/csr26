import { Router } from 'express';
import * as partnerController from '../controllers/partnerController.js';
import { authenticate, adminOnly, authenticatePartner } from '../middleware/auth.js';

const router = Router();

// ============================================
// PARTNER AUTH (Public)
// ============================================

// POST /api/partners/auth/magic-link - Send magic link to partner
router.post('/auth/magic-link', partnerController.sendPartnerMagicLink);

// GET /api/partners/auth/verify/:token - Verify magic link token
router.get('/auth/verify/:token', partnerController.verifyPartnerMagicLink);

// ============================================
// PARTNER SELF-SERVICE (Partner Auth Required)
// ============================================

// GET /api/partners/me - Get current partner dashboard
router.get('/me', authenticatePartner, partnerController.getPartnerDashboard);

// GET /api/partners/me/merchants - Get partner's merchants
router.get('/me/merchants', authenticatePartner, partnerController.getPartnerMerchants);

// GET /api/partners/me/transactions - Get partner's transactions
router.get('/me/transactions', authenticatePartner, partnerController.getPartnerTransactions);

// GET /api/partners/me/reports/summary - Get partner summary report
router.get('/me/reports/summary', authenticatePartner, partnerController.getPartnerSummaryReport);

// ============================================
// ADMIN: PARTNER MANAGEMENT
// ============================================

// GET /api/partners - List all partners (admin only)
router.get('/', authenticate, adminOnly, partnerController.getAllPartners);

// POST /api/partners - Create new partner (admin only)
router.post('/', authenticate, adminOnly, partnerController.createPartner);

// PUT /api/partners/:id - Update partner (admin only)
router.put('/:id', authenticate, adminOnly, partnerController.updatePartner);

export default router;
