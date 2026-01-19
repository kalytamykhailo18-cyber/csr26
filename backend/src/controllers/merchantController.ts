import { Request, Response, NextFunction } from 'express';
import { asyncHandler, badRequest, notFound } from '../middleware/errorHandler.js';
import { prisma } from '../lib/prisma.js';
import type { ApiResponse, Merchant, MerchantSummary, MerchantBillingInfo } from '../types/index.js';

// Helper to check merchant access
const checkMerchantAccess = (req: Request, _merchantId: string): void => {
  // Admin can access any merchant
  if (req.user!.role === 'ADMIN') return;

  // Merchants can only access their own data
  // TODO: Link user to merchant properly
  // For now, this is a placeholder check
};

// GET /api/merchants - List all merchants (admin only)
export const getAllMerchants = asyncHandler(async (_req: Request, res: Response, _next: NextFunction) => {
  const merchants = await prisma.merchant.findMany({
    include: {
      _count: {
        select: { transactions: true, skus: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const response: ApiResponse<typeof merchants> = {
    success: true,
    data: merchants,
  };

  res.json(response);
});

// GET /api/merchants/:id - Get merchant by ID
export const getMerchant = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const id = req.params.id as string;
  if (!id) throw badRequest('Merchant ID is required');
  checkMerchantAccess(req, id);

  const merchant = await prisma.merchant.findUnique({
    where: { id },
    include: {
      _count: {
        select: { transactions: true, skus: true },
      },
    },
  });

  if (!merchant) {
    throw notFound('Merchant not found');
  }

  // Calculate totals
  const totals = await prisma.transaction.aggregate({
    where: { merchantId: id, paymentStatus: 'COMPLETED' },
    _sum: { impactKg: true },
    _count: true,
  });

  const summary: MerchantSummary = {
    id: merchant.id,
    name: merchant.name,
    multiplier: merchant.multiplier,
    transactionCount: totals._count ?? 0,
    totalImpactKg: Number(totals._sum?.impactKg || 0),
    currentBalance: Number(merchant.currentBalance),
    nextBillingDate: merchant.lastBillingDate
      ? new Date(new Date(merchant.lastBillingDate).setMonth(new Date(merchant.lastBillingDate).getMonth() + 1))
      : null,
  };

  const response: ApiResponse<MerchantSummary> = {
    success: true,
    data: summary,
  };

  res.json(response);
});

// GET /api/merchants/:id/transactions - Get merchant transactions
export const getMerchantTransactions = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const id = req.params.id as string;
  if (!id) throw badRequest('Merchant ID is required');
  const { limit = '50', offset = '0', dateFrom, dateTo } = req.query;
  checkMerchantAccess(req, id);

  // Build date filter if provided
  const dateFilter: { createdAt?: { gte?: Date; lte?: Date } } = {};
  if (dateFrom || dateTo) {
    dateFilter.createdAt = {};
    if (dateFrom) {
      dateFilter.createdAt.gte = new Date(dateFrom as string);
    }
    if (dateTo) {
      // Set to end of day for inclusive filtering
      const endDate = new Date(dateTo as string);
      endDate.setHours(23, 59, 59, 999);
      dateFilter.createdAt.lte = endDate;
    }
  }

  const transactions = await prisma.transaction.findMany({
    where: { merchantId: id, ...dateFilter },
    include: {
      user: {
        select: { id: true, email: true, firstName: true, lastName: true },
      },
      sku: {
        select: { code: true, name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: parseInt(limit as string),
    skip: parseInt(offset as string),
  });

  const total = await prisma.transaction.count({ where: { merchantId: id, ...dateFilter } });

  const response: ApiResponse<{ transactions: typeof transactions; total: number }> = {
    success: true,
    data: { transactions, total },
  };

  res.json(response);
});

// GET /api/merchants/:id/billing - Get merchant billing info
export const getMerchantBilling = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const id = req.params.id as string;
  if (!id) throw badRequest('Merchant ID is required');
  checkMerchantAccess(req, id);

  const merchant = await prisma.merchant.findUnique({
    where: { id },
  });

  if (!merchant) {
    throw notFound('Merchant not found');
  }

  // Get pending transactions this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const pendingCount = await prisma.transaction.count({
    where: {
      merchantId: id,
      createdAt: { gte: startOfMonth },
    },
  });

  // Get invoices
  const invoices = await prisma.invoice.findMany({
    where: { merchantId: id },
    orderBy: { createdAt: 'desc' },
    take: 12, // Last 12 invoices
  });

  const billingInfo: MerchantBillingInfo = {
    currentBalance: Number(merchant.currentBalance),
    pendingTransactions: pendingCount,
    nextBillingDate: merchant.lastBillingDate
      ? new Date(new Date(merchant.lastBillingDate).setMonth(new Date(merchant.lastBillingDate).getMonth() + 1))
      : new Date(new Date().setMonth(new Date().getMonth() + 1)),
    lastBillingDate: merchant.lastBillingDate,
    invoices,
  };

  const response: ApiResponse<MerchantBillingInfo> = {
    success: true,
    data: billingInfo,
  };

  res.json(response);
});

// POST /api/merchants - Create new merchant (admin only)
export const createMerchant = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const { name, email, multiplier, pricePerKg, monthlyBilling, partnerId } = req.body;

  if (!name || !email) {
    throw badRequest('Name and email are required');
  }

  // Check if email already exists
  const existing = await prisma.merchant.findUnique({ where: { email } });
  if (existing) {
    throw badRequest('Merchant with this email already exists');
  }

  const merchant = await prisma.merchant.create({
    data: {
      name,
      email,
      multiplier: multiplier || 1,
      pricePerKg,
      monthlyBilling: monthlyBilling !== false,
      partnerId,
    },
  });

  const response: ApiResponse<Merchant> = {
    success: true,
    data: merchant,
  };

  res.status(201).json(response);
});

// PUT /api/merchants/:id - Update merchant (admin only)
export const updateMerchant = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const id = req.params.id as string;
  if (!id) throw badRequest('Merchant ID is required');
  const updateData = req.body;

  const existing = await prisma.merchant.findUnique({ where: { id } });
  if (!existing) {
    throw notFound('Merchant not found');
  }

  const merchant = await prisma.merchant.update({
    where: { id },
    data: updateData,
  });

  const response: ApiResponse<Merchant> = {
    success: true,
    data: merchant,
  };

  res.json(response);
});
