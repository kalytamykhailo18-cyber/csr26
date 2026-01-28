// CSR26 Admin Controller
// Handles admin-only operations: Corsair export, reports, transaction management

import { Request, Response, NextFunction } from 'express';
import { asyncHandler, badRequest, notFound } from '../middleware/errorHandler.js';
import { prisma } from '../lib/prisma.js';
import {
  exportPendingCertifiedUsers,
  exportAllCertifiedUsers,
  getCorsairExportStats,
  convertToCSV,
  CorsairBatchExportResult,
} from '../services/corsairService.js';
import {
  runMonthlyBilling,
  getBillingStats,
  getMerchantsWithBalance,
  getInvoiceDetails,
  markInvoicePaid,
  MonthlyBillingResult,
} from '../services/billingService.js';
import {
  runDailyTasks,
  runMonthlyTasks,
  runAllTasks,
  CronRunResult,
} from '../services/cronService.js';
import {
  calculateMaturationBreakdown,
  updateUserWallet,
} from '../services/calculationService.js';
import type { ApiResponse } from '../types/index.js';

// ============================================
// CORSAIR EXPORT ENDPOINTS
// ============================================

// GET /api/admin/corsair/stats - Get Corsair export statistics
export const getCorsairStats = asyncHandler(async (_req: Request, res: Response, _next: NextFunction) => {
  const stats = await getCorsairExportStats();

  const response: ApiResponse<typeof stats> = {
    success: true,
    data: stats,
  };

  res.json(response);
});

// POST /api/admin/corsair/export-pending - Export pending certified users
export const exportPending = asyncHandler(async (_req: Request, res: Response, _next: NextFunction) => {
  const result = await exportPendingCertifiedUsers();

  const response: ApiResponse<CorsairBatchExportResult> = {
    success: true,
    data: result,
  };

  res.json(response);
});

// POST /api/admin/corsair/export-all - Export all certified users
export const exportAll = asyncHandler(async (_req: Request, res: Response, _next: NextFunction) => {
  const result = await exportAllCertifiedUsers();

  const response: ApiResponse<CorsairBatchExportResult> = {
    success: true,
    data: result,
  };

  res.json(response);
});

// GET /api/admin/corsair/download - Download CSV export
export const downloadCorsairCSV = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const { type = 'all' } = req.query;

  let result: CorsairBatchExportResult;

  if (type === 'pending') {
    result = await exportPendingCertifiedUsers();
  } else {
    result = await exportAllCertifiedUsers();
  }

  const csv = convertToCSV(result.records);
  const filename = `corsair-export-${type}-${new Date().toISOString().split('T')[0]}.csv`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
});

// ============================================
// ADMIN REPORTS
// ============================================

// GET /api/admin/reports/summary - Monthly summary report
export const getMonthlySummary = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const { year, month } = req.query;

  // Default to current month
  const now = new Date();
  const reportYear = year ? parseInt(year as string) : now.getFullYear();
  const reportMonth = month ? parseInt(month as string) - 1 : now.getMonth();

  const startDate = new Date(reportYear, reportMonth, 1);
  const endDate = new Date(reportYear, reportMonth + 1, 0, 23, 59, 59, 999);

  // Get transactions for the period
  const transactions = await prisma.transaction.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
      paymentStatus: 'COMPLETED',
    },
    include: {
      merchant: { select: { id: true, name: true } },
    },
  });

  // Calculate totals
  const totalTransactions = transactions.length;
  const totalRevenue = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
  const totalImpactKg = transactions.reduce((sum, t) => sum + Number(t.impactKg), 0);

  // Group by payment mode
  const byPaymentModeMap: Record<string, { count: number; revenue: number; impactKg: number }> = {};
  for (const t of transactions) {
    const mode = t.paymentMode;
    if (!byPaymentModeMap[mode]) {
      byPaymentModeMap[mode] = { count: 0, revenue: 0, impactKg: 0 };
    }
    byPaymentModeMap[mode].count++;
    byPaymentModeMap[mode].revenue += Number(t.amount);
    byPaymentModeMap[mode].impactKg += Number(t.impactKg);
  }

  // Group by merchant
  const byMerchantMap: Record<string, { id: string; name: string; count: number; revenue: number; impactKg: number }> = {};
  for (const t of transactions) {
    const merchantKey = t.merchantId || 'direct';
    const merchantName = t.merchant?.name || 'Direct Sales';
    if (!byMerchantMap[merchantKey]) {
      byMerchantMap[merchantKey] = { id: merchantKey, name: merchantName, count: 0, revenue: 0, impactKg: 0 };
    }
    byMerchantMap[merchantKey].count++;
    byMerchantMap[merchantKey].revenue += Number(t.amount);
    byMerchantMap[merchantKey].impactKg += Number(t.impactKg);
  }
  const byMerchant = Object.values(byMerchantMap);

  // Get user statistics
  const [totalUsers, newUsers, certifiedUsers] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
    }),
    prisma.user.count({
      where: { status: 'CERTIFIED' },
    }),
  ]);

  const response: ApiResponse<{
    period: { year: number; month: number; startDate: string; endDate: string };
    totals: { transactions: number; revenue: number; impactKg: number };
    byPaymentMode: Record<string, { count: number; revenue: number; impactKg: number }>;
    byMerchant: { id: string; name: string; count: number; revenue: number; impactKg: number }[];
    users: { total: number; new: number; certified: number };
  }> = {
    success: true,
    data: {
      period: {
        year: reportYear,
        month: reportMonth + 1,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      totals: {
        transactions: totalTransactions,
        revenue: totalRevenue,
        impactKg: totalImpactKg,
      },
      byPaymentMode: byPaymentModeMap,
      byMerchant,
      users: {
        total: totalUsers,
        new: newUsers,
        certified: certifiedUsers,
      },
    },
  };

  res.json(response);
});

// GET /api/admin/reports/revenue - Revenue by merchant/partner report
export const getRevenueReport = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const startStr = req.query.startDate ? String(req.query.startDate) : undefined;
  const endStr = req.query.endDate ? String(req.query.endDate) : undefined;
  const groupBy = String(req.query.groupBy || 'merchant');

  // Default to last 30 days
  const endDate = endStr ? new Date(endStr) : new Date();
  const startDate = startStr ? new Date(startStr) : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

  const transactions = await prisma.transaction.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
      paymentStatus: 'COMPLETED',
    },
    include: {
      merchant: { select: { id: true, name: true, partnerId: true } },
    },
  });

  let groupedData: Record<string, { id: string; name: string; count: number; revenue: number; impactKg: number }>;

  if (groupBy === 'partner') {
    groupedData = transactions.reduce((acc, t) => {
      const partnerId = t.partnerId || t.merchant?.partnerId || 'direct';
      acc[partnerId] = acc[partnerId] || { id: partnerId, name: partnerId === 'direct' ? 'Direct' : partnerId, count: 0, revenue: 0, impactKg: 0 };
      acc[partnerId].count++;
      acc[partnerId].revenue += Number(t.amount);
      acc[partnerId].impactKg += Number(t.impactKg);
      return acc;
    }, {} as typeof groupedData);
  } else {
    groupedData = transactions.reduce((acc, t) => {
      const merchantId = t.merchantId || 'direct';
      const merchantName = t.merchant?.name || 'Direct Sales';
      acc[merchantId] = acc[merchantId] || { id: merchantId, name: merchantName, count: 0, revenue: 0, impactKg: 0 };
      acc[merchantId].count++;
      acc[merchantId].revenue += Number(t.amount);
      acc[merchantId].impactKg += Number(t.impactKg);
      return acc;
    }, {} as typeof groupedData);
  }

  const response: ApiResponse<{
    period: { startDate: string; endDate: string };
    groupBy: string;
    data: { id: string; name: string; count: number; revenue: number; impactKg: number }[];
    totals: { count: number; revenue: number; impactKg: number };
  }> = {
    success: true,
    data: {
      period: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
      groupBy: String(groupBy),
      data: Object.values(groupedData),
      totals: {
        count: transactions.length,
        revenue: transactions.reduce((sum, t) => sum + Number(t.amount), 0),
        impactKg: transactions.reduce((sum, t) => sum + Number(t.impactKg), 0),
      },
    },
  };

  res.json(response);
});

// GET /api/admin/reports/impact - Total impact report
export const getImpactReport = asyncHandler(async (_req: Request, res: Response, _next: NextFunction) => {
  // Get overall impact statistics
  const [totalTransactions, completedTransactions] = await Promise.all([
    prisma.transaction.count(),
    prisma.transaction.aggregate({
      where: { paymentStatus: 'COMPLETED' },
      _sum: { impactKg: true, amount: true },
      _count: true,
    }),
  ]);

  // Get matured vs pending impact
  const users = await prisma.user.aggregate({
    _sum: {
      walletImpactKg: true,
      maturedImpactKg: true,
      pendingImpactKg: true,
    },
  });

  // Calculate equivalent bottles (1kg ≈ 25 bottles)
  const totalImpactKg = Number(completedTransactions._sum.impactKg || 0);
  const equivalentBottles = Math.round(totalImpactKg * 25);

  const response: ApiResponse<{
    totalTransactions: number;
    completedTransactions: number;
    totalRevenue: number;
    totalImpactKg: number;
    maturedImpactKg: number;
    pendingImpactKg: number;
    equivalentBottles: number;
  }> = {
    success: true,
    data: {
      totalTransactions,
      completedTransactions: completedTransactions._count,
      totalRevenue: Number(completedTransactions._sum.amount || 0),
      totalImpactKg,
      maturedImpactKg: Number(users._sum.maturedImpactKg || 0),
      pendingImpactKg: Number(users._sum.pendingImpactKg || 0),
      equivalentBottles,
    },
  };

  res.json(response);
});

// GET /api/admin/reports/users - User growth report
export const getUserGrowthReport = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const { days = '30' } = req.query;
  const numDays = parseInt(days as string);

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - numDays);

  // Get daily user registrations
  const users = await prisma.user.findMany({
    where: {
      createdAt: { gte: startDate },
    },
    select: {
      createdAt: true,
      status: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  // Group by date
  const dailyDataMap: Record<string, { date: string; total: number; certified: number }> = {};
  for (const user of users) {
    const date = user.createdAt.toISOString().slice(0, 10);
    if (!dailyDataMap[date]) {
      dailyDataMap[date] = { date, total: 0, certified: 0 };
    }
    dailyDataMap[date].total++;
    if (user.status === 'CERTIFIED') {
      dailyDataMap[date].certified++;
    }
  }

  // Get cumulative totals
  const [totalUsers, certifiedUsers, accumulationUsers] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: 'CERTIFIED' } }),
    prisma.user.count({ where: { status: 'ACCUMULATION' } }),
  ]);

  const response: ApiResponse<{
    period: { startDate: string; endDate: string; days: number };
    dailyGrowth: { date: string; total: number; certified: number }[];
    totals: { total: number; certified: number; accumulation: number };
  }> = {
    success: true,
    data: {
      period: {
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
        days: numDays,
      },
      dailyGrowth: Object.values(dailyDataMap),
      totals: {
        total: totalUsers,
        certified: certifiedUsers,
        accumulation: accumulationUsers,
      },
    },
  };

  res.json(response);
});

// ============================================
// TRANSACTION MANAGEMENT
// ============================================

// GET /api/admin/transactions - List all transactions with filters
export const getAllTransactionsAdmin = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  // Cast query params to strings
  const limitStr = String(req.query.limit || '50');
  const offsetStr = String(req.query.offset || '0');
  const paymentMode = req.query.paymentMode ? String(req.query.paymentMode) : undefined;
  const paymentStatus = req.query.paymentStatus ? String(req.query.paymentStatus) : undefined;
  const merchantId = req.query.merchantId ? String(req.query.merchantId) : undefined;
  const startDateStr = req.query.startDate ? String(req.query.startDate) : undefined;
  const endDateStr = req.query.endDate ? String(req.query.endDate) : undefined;
  const search = req.query.search ? String(req.query.search) : undefined;

  // Build where clause
  const where: Record<string, unknown> = {};

  if (paymentMode) where.paymentMode = paymentMode;
  if (paymentStatus) where.paymentStatus = paymentStatus;
  if (merchantId) where.merchantId = merchantId;

  if (startDateStr || endDateStr) {
    where.createdAt = {};
    if (startDateStr) (where.createdAt as Record<string, Date>).gte = new Date(startDateStr);
    if (endDateStr) (where.createdAt as Record<string, Date>).lte = new Date(endDateStr);
  }

  // Search by user email if provided
  if (search) {
    where.user = {
      OR: [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ],
    };
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        sku: true,
        merchant: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limitStr),
      skip: parseInt(offsetStr),
    }),
    prisma.transaction.count({ where }),
  ]);

  const response: ApiResponse<{ transactions: typeof transactions; total: number }> = {
    success: true,
    data: { transactions, total },
  };

  res.json(response);
});

// PATCH /api/admin/transactions/:id - Update transaction status
export const updateTransactionStatus = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const id = req.params.id ? String(req.params.id) : undefined;
  const { paymentStatus } = req.body;

  if (!id) throw badRequest('Transaction ID is required');
  if (!paymentStatus) throw badRequest('Payment status is required');

  const validStatuses = ['PENDING', 'COMPLETED', 'FAILED'];
  if (!validStatuses.includes(paymentStatus)) {
    throw badRequest(`Invalid payment status. Must be one of: ${validStatuses.join(', ')}`);
  }

  const transaction = await prisma.transaction.findUnique({
    where: { id },
  });

  if (!transaction) {
    throw notFound('Transaction not found');
  }

  const updated = await prisma.transaction.update({
    where: { id },
    data: { paymentStatus },
    include: {
      user: { select: { id: true, email: true } },
      merchant: { select: { id: true, name: true } },
    },
  });

  const response: ApiResponse<typeof updated> = {
    success: true,
    data: updated,
  };

  res.json(response);
});

// POST /api/admin/transactions/manual - Create manual transaction for corrections
export const createManualTransaction = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const { email, amount, paymentMode, reason } = req.body;

  if (!email) throw badRequest('User email is required');
  if (!amount || amount <= 0) throw badRequest('Valid amount is required');
  if (!paymentMode) throw badRequest('Payment mode is required');
  if (!reason || !reason.trim()) throw badRequest('Reason is required for audit trail');

  const validModes = ['CLAIM', 'PAY', 'GIFT_CARD', 'ALLOCATION'];
  if (!validModes.includes(paymentMode)) {
    throw badRequest(`Invalid payment mode. Must be one of: ${validModes.join(', ')}`);
  }

  // Find or create user by email
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: { email },
    });
  }

  // Calculate impact (€0.11 per kg)
  const pricePerKgSetting = await prisma.setting.findUnique({ where: { key: 'PRICE_PER_KG' } });
  const pricePerKg = pricePerKgSetting ? parseFloat(pricePerKgSetting.value) : 0.11;
  const impactKg = amount / pricePerKg;
  const transactionAmount = parseFloat(String(amount));

  // Calculate maturation breakdown (5/45/50 Rule)
  const maturation = calculateMaturationBreakdown(impactKg);

  // Create transaction with admin note and maturation data
  const transaction = await prisma.transaction.create({
    data: {
      userId: user.id,
      amount: transactionAmount,
      impactKg,
      paymentMode,
      paymentStatus: 'COMPLETED', // Manual transactions are pre-completed
      // Store reason in masterId for audit trail
      masterId: `MANUAL:${reason}`,
      // Maturation tracking (5/45/50 Rule)
      immediateImpactKg: maturation.immediateKg,
      midTermImpactKg: maturation.midTermKg,
      finalImpactKg: maturation.finalKg,
      midTermMaturesAt: maturation.midTermMaturesAt,
      finalMaturesAt: maturation.finalMaturesAt,
    },
    include: {
      user: { select: { id: true, email: true } },
    },
  });

  // Update user wallet with proper maturation tracking
  // This also handles threshold check and Corsair export trigger
  await updateUserWallet(user.id, transactionAmount, impactKg);

  const response: ApiResponse<typeof transaction> = {
    success: true,
    data: transaction,
  };

  res.status(201).json(response);
});

// ============================================
// ADMIN SKU ACCESS
// ============================================

// POST /api/admin/access - Verify admin access via special SKU code
export const verifyAdminAccess = asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  const { code } = req.body;

  // Check for admin access code
  const ADMIN_ACCESS_CODE = process.env.ADMIN_ACCESS_CODE || 'ADMIN-ACCESS-2026';

  if (code !== ADMIN_ACCESS_CODE) {
    throw badRequest('Invalid access code');
  }

  // If user is authenticated, upgrade their role to admin
  if (req.user) {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { role: 'ADMIN' },
    });

    const response: ApiResponse<{ message: string; role: string }> = {
      success: true,
      data: { message: 'Admin access granted', role: 'ADMIN' },
    };

    res.json(response);
    return;
  }

  // Just verify the code is valid
  const response: ApiResponse<{ message: string; valid: boolean }> = {
    success: true,
    data: { message: 'Access code valid', valid: true },
  };

  res.json(response);
});

// ============================================
// BILLING ENDPOINTS
// ============================================

// GET /api/admin/billing/stats - Get billing statistics
export const getBillingStatistics = asyncHandler(async (_req: Request, res: Response, _next: NextFunction) => {
  const stats = await getBillingStats();

  const response: ApiResponse<typeof stats> = {
    success: true,
    data: stats,
  };

  res.json(response);
});

// GET /api/admin/billing/outstanding - Get merchants with outstanding balances
export const getOutstandingBalances = asyncHandler(async (_req: Request, res: Response, _next: NextFunction) => {
  const merchants = await getMerchantsWithBalance();

  const response: ApiResponse<typeof merchants> = {
    success: true,
    data: merchants,
  };

  res.json(response);
});

// POST /api/admin/billing/run - Run monthly billing (can be triggered manually or via cron)
export const triggerMonthlyBilling = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const { year, month } = req.body;

  const result = await runMonthlyBilling(year, month);

  const response: ApiResponse<MonthlyBillingResult> = {
    success: true,
    data: result,
  };

  res.json(response);
});

// GET /api/admin/billing/invoices/:id - Get invoice details
export const getInvoice = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const id = req.params.id;
  if (!id) throw badRequest('Invoice ID is required');

  const invoice = await getInvoiceDetails(String(id));

  if (!invoice) {
    throw notFound('Invoice not found');
  }

  const response: ApiResponse<typeof invoice> = {
    success: true,
    data: invoice,
  };

  res.json(response);
});

// POST /api/admin/billing/invoices/:id/pay - Mark invoice as paid
export const payInvoice = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const id = req.params.id;
  const { stripePaymentId } = req.body;
  if (!id) throw badRequest('Invoice ID is required');

  const invoice = await markInvoicePaid(String(id), stripePaymentId);

  const response: ApiResponse<typeof invoice> = {
    success: true,
    data: invoice,
  };

  res.json(response);
});

// ============================================
// CRON ENDPOINTS
// ============================================

// POST /api/admin/cron/daily - Run daily cron tasks
export const runDailyCron = asyncHandler(async (_req: Request, res: Response, _next: NextFunction) => {
  const result = await runDailyTasks();

  const response: ApiResponse<CronRunResult> = {
    success: true,
    data: result,
  };

  res.json(response);
});

// POST /api/admin/cron/monthly - Run monthly cron tasks
export const runMonthlyCron = asyncHandler(async (_req: Request, res: Response, _next: NextFunction) => {
  const result = await runMonthlyTasks();

  const response: ApiResponse<CronRunResult> = {
    success: true,
    data: result,
  };

  res.json(response);
});

// POST /api/admin/cron/all - Run all cron tasks
export const runAllCron = asyncHandler(async (_req: Request, res: Response, _next: NextFunction) => {
  const result = await runAllTasks();

  const response: ApiResponse<CronRunResult> = {
    success: true,
    data: result,
  };

  res.json(response);
});
