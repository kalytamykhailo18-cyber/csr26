import { Router } from 'express';
import * as adminController from '../controllers/adminController.js';
import { authenticate, adminOnly, optionalAuth } from '../middleware/auth.js';

const router = Router();

// ============================================
// CORSAIR EXPORT ENDPOINTS (Admin Only)
// ============================================

// GET /api/admin/corsair/stats - Get Corsair export statistics
router.get('/corsair/stats', authenticate, adminOnly, adminController.getCorsairStats);

// POST /api/admin/corsair/export-pending - Export pending certified users
router.post('/corsair/export-pending', authenticate, adminOnly, adminController.exportPending);

// POST /api/admin/corsair/export-all - Export all certified users
router.post('/corsair/export-all', authenticate, adminOnly, adminController.exportAll);

// GET /api/admin/corsair/download - Download CSV export
router.get('/corsair/download', authenticate, adminOnly, adminController.downloadCorsairCSV);

// ============================================
// ADMIN REPORTS (Admin Only)
// ============================================

// GET /api/admin/reports/summary - Monthly summary report
router.get('/reports/summary', authenticate, adminOnly, adminController.getMonthlySummary);

// GET /api/admin/reports/revenue - Revenue by merchant/partner report
router.get('/reports/revenue', authenticate, adminOnly, adminController.getRevenueReport);

// GET /api/admin/reports/impact - Total impact report
router.get('/reports/impact', authenticate, adminOnly, adminController.getImpactReport);

// GET /api/admin/reports/users - User growth report
router.get('/reports/users', authenticate, adminOnly, adminController.getUserGrowthReport);

// ============================================
// TRANSACTION MANAGEMENT (Admin Only)
// ============================================

// GET /api/admin/transactions - List all transactions with filters
router.get('/transactions', authenticate, adminOnly, adminController.getAllTransactionsAdmin);

// PATCH /api/admin/transactions/:id - Update transaction status
router.patch('/transactions/:id', authenticate, adminOnly, adminController.updateTransactionStatus);

// ============================================
// ADMIN ACCESS (Special SKU Code)
// ============================================

// POST /api/admin/access - Verify admin access via special SKU code
router.post('/access', optionalAuth, adminController.verifyAdminAccess);

// ============================================
// BILLING ENDPOINTS (Admin Only)
// ============================================

// GET /api/admin/billing/stats - Get billing statistics
router.get('/billing/stats', authenticate, adminOnly, adminController.getBillingStatistics);

// GET /api/admin/billing/outstanding - Get merchants with outstanding balances
router.get('/billing/outstanding', authenticate, adminOnly, adminController.getOutstandingBalances);

// POST /api/admin/billing/run - Run monthly billing
router.post('/billing/run', authenticate, adminOnly, adminController.triggerMonthlyBilling);

// GET /api/admin/billing/invoices/:id - Get invoice details
router.get('/billing/invoices/:id', authenticate, adminOnly, adminController.getInvoice);

// POST /api/admin/billing/invoices/:id/pay - Mark invoice as paid
router.post('/billing/invoices/:id/pay', authenticate, adminOnly, adminController.payInvoice);

// ============================================
// CRON ENDPOINTS (Admin Only)
// ============================================

// POST /api/admin/cron/daily - Run daily cron tasks (maturation processing)
router.post('/cron/daily', authenticate, adminOnly, adminController.runDailyCron);

// POST /api/admin/cron/monthly - Run monthly cron tasks (billing + Corsair export)
router.post('/cron/monthly', authenticate, adminOnly, adminController.runMonthlyCron);

// POST /api/admin/cron/all - Run all cron tasks
router.post('/cron/all', authenticate, adminOnly, adminController.runAllCron);

export default router;
