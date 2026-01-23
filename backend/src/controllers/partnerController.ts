// CSR26 Partner Controller
// Handles partner authentication, dashboard, and merchant management

import { Request, Response, NextFunction } from 'express';
import { asyncHandler, badRequest, notFound, forbidden } from '../middleware/errorHandler.js';
import { prisma } from '../lib/prisma.js';
import { sendMagicLinkEmail } from '../services/emailService.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import type { ApiResponse } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-change-in-production';

// ============================================
// PARTNER AUTH
// ============================================

// POST /api/partners/auth/magic-link - Send magic link to partner
export const sendPartnerMagicLink = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const { email } = req.body;

  if (!email) {
    throw badRequest('Email is required');
  }

  const partner = await prisma.partner.findUnique({
    where: { email },
  });

  if (!partner) {
    throw notFound('Partner not found');
  }

  if (!partner.active) {
    throw forbidden('Partner account is inactive');
  }

  // Generate magic link token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  await prisma.partnerMagicLink.create({
    data: {
      partnerId: partner.id,
      token,
      expiresAt,
    },
  });

  // LOG MAGIC LINK FOR PM2 LOGS
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  console.log('========================================');
  console.log('PARTNER MAGIC LINK GENERATED');
  console.log('Email:', email);
  console.log('Partner:', partner.name);
  console.log('Token:', token);
  console.log('URL:', `${frontendUrl}/partner/verify/${token}`);
  console.log('Expires:', expiresAt.toISOString());
  console.log('========================================');

  // Send email
  await sendMagicLinkEmail(email, token, partner.name, 'partner');

  const response: ApiResponse<{ message: string }> = {
    success: true,
    data: { message: 'Magic link sent to email' },
  };

  res.json(response);
});

// GET /api/partners/auth/verify/:token - Verify magic link token
export const verifyPartnerMagicLink = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const { token } = req.params;

  if (!token) {
    throw badRequest('Token is required');
  }

  const magicLink = await prisma.partnerMagicLink.findUnique({
    where: { token: String(token) },
    include: { partner: true },
  });

  if (!magicLink) {
    throw notFound('Invalid or expired token');
  }

  if (magicLink.used) {
    throw badRequest('Magic link already used');
  }

  if (magicLink.expiresAt < new Date()) {
    throw badRequest('Magic link expired');
  }

  // Mark as used
  await prisma.partnerMagicLink.update({
    where: { token: String(token) },
    data: { used: true },
  });

  // Generate JWT for partner
  const jwtToken = jwt.sign(
    {
      partnerId: magicLink.partner.id,
      email: magicLink.partner.email,
      type: 'partner',
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const response: ApiResponse<{
    partner: {
      id: string;
      name: string;
      email: string;
    };
    token: string;
  }> = {
    success: true,
    data: {
      partner: {
        id: magicLink.partner.id,
        name: magicLink.partner.name,
        email: magicLink.partner.email,
      },
      token: jwtToken,
    },
  };

  res.json(response);
});

// ============================================
// PARTNER DASHBOARD
// ============================================

// GET /api/partners/me - Get current partner dashboard
export const getPartnerDashboard = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const partnerId = (req as any).partnerId;

  if (!partnerId) {
    throw forbidden('Partner authentication required');
  }

  const partner = await prisma.partner.findUnique({
    where: { id: partnerId },
    include: {
      merchants: {
        select: {
          id: true,
          name: true,
          email: true,
          multiplier: true,
          currentBalance: true,
          _count: { select: { transactions: true } },
        },
      },
    },
  });

  if (!partner) {
    throw notFound('Partner not found');
  }

  // Get total transactions across all merchants
  const merchantIds = partner.merchants.map(m => m.id);

  const transactionStats = await prisma.transaction.aggregate({
    where: {
      merchantId: { in: merchantIds },
      paymentStatus: 'COMPLETED',
    },
    _sum: { amount: true, impactKg: true },
    _count: true,
  });

  // Get transactions directly attributed to partner
  const directTransactions = await prisma.transaction.aggregate({
    where: {
      partnerId: partnerId,
      paymentStatus: 'COMPLETED',
    },
    _sum: { amount: true, impactKg: true },
    _count: true,
  });

  // Get this month's stats
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const monthlyStats = await prisma.transaction.aggregate({
    where: {
      OR: [
        { merchantId: { in: merchantIds } },
        { partnerId: partnerId },
      ],
      paymentStatus: 'COMPLETED',
      createdAt: { gte: startOfMonth },
    },
    _sum: { amount: true, impactKg: true },
    _count: true,
  });

  const dashboard = {
    partner: {
      id: partner.id,
      name: partner.name,
      email: partner.email,
      contactPerson: partner.contactPerson,
      commissionRate: Number(partner.commissionRate),
      active: partner.active,
    },
    merchants: partner.merchants.map(m => ({
      id: m.id,
      name: m.name,
      email: m.email,
      multiplier: m.multiplier,
      currentBalance: Number(m.currentBalance),
      transactionCount: m._count.transactions,
    })),
    stats: {
      totalMerchants: partner.merchants.length,
      totalTransactions: (transactionStats._count || 0) + (directTransactions._count || 0),
      totalRevenue: Number(transactionStats._sum.amount || 0) + Number(directTransactions._sum.amount || 0),
      totalImpactKg: Number(transactionStats._sum.impactKg || 0) + Number(directTransactions._sum.impactKg || 0),
      monthlyTransactions: monthlyStats._count || 0,
      monthlyRevenue: Number(monthlyStats._sum.amount || 0),
      monthlyImpactKg: Number(monthlyStats._sum.impactKg || 0),
    },
  };

  const response: ApiResponse<typeof dashboard> = {
    success: true,
    data: dashboard,
  };

  res.json(response);
});

// GET /api/partners/me/merchants - Get partner's merchants
export const getPartnerMerchants = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const partnerId = (req as any).partnerId;

  if (!partnerId) {
    throw forbidden('Partner authentication required');
  }

  const merchants = await prisma.merchant.findMany({
    where: { partnerId },
    include: {
      _count: { select: { transactions: true, skus: true } },
    },
    orderBy: { name: 'asc' },
  });

  // Get transaction stats for each merchant
  const merchantsWithStats = await Promise.all(
    merchants.map(async (m) => {
      const stats = await prisma.transaction.aggregate({
        where: { merchantId: m.id, paymentStatus: 'COMPLETED' },
        _sum: { amount: true, impactKg: true },
      });

      return {
        id: m.id,
        name: m.name,
        email: m.email,
        multiplier: m.multiplier,
        monthlyBilling: m.monthlyBilling,
        currentBalance: Number(m.currentBalance),
        transactionCount: m._count.transactions,
        skuCount: m._count.skus,
        totalRevenue: Number(stats._sum.amount || 0),
        totalImpactKg: Number(stats._sum.impactKg || 0),
        createdAt: m.createdAt,
      };
    })
  );

  const response: ApiResponse<typeof merchantsWithStats> = {
    success: true,
    data: merchantsWithStats,
  };

  res.json(response);
});

// GET /api/partners/me/transactions - Get partner's transactions
export const getPartnerTransactions = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const partnerId = (req as any).partnerId;
  const limitStr = String(req.query.limit || '50');
  const offsetStr = String(req.query.offset || '0');
  const merchantId = req.query.merchantId ? String(req.query.merchantId) : undefined;

  if (!partnerId) {
    throw forbidden('Partner authentication required');
  }

  // Get merchant IDs for this partner
  const partnerMerchants = await prisma.merchant.findMany({
    where: { partnerId },
    select: { id: true },
  });
  const merchantIds = partnerMerchants.map(m => m.id);

  // Build where clause
  const where: any = {
    OR: [
      { merchantId: { in: merchantIds } },
      { partnerId: partnerId },
    ],
  };

  // Filter by specific merchant if provided
  if (merchantId) {
    if (!merchantIds.includes(merchantId)) {
      throw forbidden('Access denied to this merchant');
    }
    where.merchantId = merchantId;
    delete where.OR;
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        user: { select: { email: true, firstName: true, lastName: true } },
        merchant: { select: { name: true } },
        sku: { select: { code: true, name: true } },
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

// GET /api/partners/me/reports/summary - Get partner summary report
export const getPartnerSummaryReport = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const partnerId = (req as any).partnerId;
  const year = req.query.year ? parseInt(String(req.query.year)) : new Date().getFullYear();
  const month = req.query.month ? parseInt(String(req.query.month)) - 1 : new Date().getMonth();

  if (!partnerId) {
    throw forbidden('Partner authentication required');
  }

  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

  // Get merchant IDs
  const partnerMerchants = await prisma.merchant.findMany({
    where: { partnerId },
    select: { id: true, name: true },
  });
  const merchantIds = partnerMerchants.map(m => m.id);

  // Get transactions for the period
  const transactions = await prisma.transaction.findMany({
    where: {
      OR: [
        { merchantId: { in: merchantIds } },
        { partnerId: partnerId },
      ],
      paymentStatus: 'COMPLETED',
      createdAt: { gte: startDate, lte: endDate },
    },
    include: {
      merchant: { select: { id: true, name: true } },
    },
  });

  // Group by merchant
  const byMerchant: Record<string, { name: string; count: number; revenue: number; impactKg: number }> = {};
  for (const t of transactions) {
    const key = t.merchantId || 'direct';
    const name = t.merchant?.name || 'Direct';
    if (!byMerchant[key]) {
      byMerchant[key] = { name, count: 0, revenue: 0, impactKg: 0 };
    }
    byMerchant[key].count++;
    byMerchant[key].revenue += Number(t.amount);
    byMerchant[key].impactKg += Number(t.impactKg);
  }

  // Group by payment mode
  const byPaymentMode: Record<string, { count: number; revenue: number; impactKg: number }> = {};
  for (const t of transactions) {
    if (!byPaymentMode[t.paymentMode]) {
      byPaymentMode[t.paymentMode] = { count: 0, revenue: 0, impactKg: 0 };
    }
    const mode = byPaymentMode[t.paymentMode]!;
    mode.count++;
    mode.revenue += Number(t.amount);
    mode.impactKg += Number(t.impactKg);
  }

  const totalRevenue = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
  const totalImpactKg = transactions.reduce((sum, t) => sum + Number(t.impactKg), 0);

  // Get partner's commission rate
  const partner = await prisma.partner.findUnique({
    where: { id: partnerId },
    select: { commissionRate: true },
  });

  const commissionRate = Number(partner?.commissionRate || 0);
  const estimatedCommission = totalRevenue * (commissionRate / 100);

  const report = {
    period: {
      year,
      month: month + 1,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    },
    totals: {
      transactions: transactions.length,
      revenue: totalRevenue,
      impactKg: totalImpactKg,
      estimatedCommission,
    },
    byMerchant: Object.entries(byMerchant).map(([id, data]) => ({ id, ...data })),
    byPaymentMode,
  };

  const response: ApiResponse<typeof report> = {
    success: true,
    data: report,
  };

  res.json(response);
});

// ============================================
// ADMIN: PARTNER MANAGEMENT
// ============================================

// GET /api/partners - List all partners (admin only)
export const getAllPartners = asyncHandler(async (_req: Request, res: Response, _next: NextFunction) => {
  const partners = await prisma.partner.findMany({
    include: {
      _count: { select: { merchants: true } },
    },
    orderBy: { name: 'asc' },
  });

  const response: ApiResponse<typeof partners> = {
    success: true,
    data: partners,
  };

  res.json(response);
});

// POST /api/partners - Create new partner (admin only)
export const createPartner = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const { name, email, contactPerson, commissionRate } = req.body;

  if (!name || !email) {
    throw badRequest('Name and email are required');
  }

  const existing = await prisma.partner.findUnique({ where: { email } });
  if (existing) {
    throw badRequest('Partner with this email already exists');
  }

  const partner = await prisma.partner.create({
    data: {
      name,
      email,
      contactPerson,
      commissionRate: commissionRate || 0,
    },
  });

  const response: ApiResponse<typeof partner> = {
    success: true,
    data: partner,
  };

  res.status(201).json(response);
});

// PUT /api/partners/:id - Update partner (admin only)
export const updatePartner = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const { id } = req.params;
  const updateData = req.body;

  const existing = await prisma.partner.findUnique({ where: { id: String(id) } });
  if (!existing) {
    throw notFound('Partner not found');
  }

  const partner = await prisma.partner.update({
    where: { id: String(id) },
    data: updateData,
  });

  const response: ApiResponse<typeof partner> = {
    success: true,
    data: partner,
  };

  res.json(response);
});
