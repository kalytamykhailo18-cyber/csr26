import { Request, Response, NextFunction } from 'express';
import { asyncHandler, badRequest, notFound } from '../middleware/errorHandler.js';
import { prisma } from '../lib/prisma.js';
import {
  calculateImpact,
  calculateWeightBasedImpact,
  updateUserWallet,
  calculateMaturationBreakdown,
} from '../services/calculationService.js';
import type { ApiResponse, CreateTransactionRequest, Transaction, TransactionWithRelations } from '../types/index.js';

// POST /api/transactions - Create new transaction
export const createTransaction = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const data: CreateTransactionRequest = req.body;
  const { skuCode, amount, paymentMode, giftCode, merchantId, partnerId, weightGrams, multiplier } = data;

  if (!paymentMode) {
    throw badRequest('paymentMode is required');
  }

  // Get or create user
  let userId = req.user?.id;

  if (!userId) {
    // For anonymous transactions, we need email in body
    const { email, firstName, lastName } = req.body;
    if (!email) {
      throw badRequest('Email is required for new users');
    }

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: { email, firstName, lastName },
      });
    }
    userId = user.id;
  }

  // Calculate impact
  // For weight-based products (CLAIM/ALLOCATION), calculate from weight
  // For amount-based (PAY/GIFT_CARD), calculate from amount
  let impact;
  let transactionAmount: number;
  let merchantCost: number;

  if (weightGrams && weightGrams > 0) {
    // Weight-based calculation (supermarket products, e-commerce dynamic weight)
    // Formula: Impact = Weight (kg) × Multiplier
    // Merchant cost = Weight (kg) × €0.11 × Multiplier
    const effectiveMultiplier = multiplier && multiplier > 0 ? multiplier : 1;
    impact = await calculateWeightBasedImpact(weightGrams, effectiveMultiplier);
    // For weight-based, the calculated amount IS the merchant cost
    transactionAmount = impact.amount;
    merchantCost = impact.amount;
  } else {
    // Standard calculation (amount-based)
    const inputAmount = amount ?? 0;
    impact = await calculateImpact(inputAmount);
    transactionAmount = inputAmount;
    merchantCost = inputAmount;
  }

  // Calculate maturation breakdown
  const maturation = calculateMaturationBreakdown(impact.impactKg);

  // Create transaction with maturation data
  const transaction = await prisma.transaction.create({
    data: {
      userId,
      skuCode,
      amount: transactionAmount,
      impactKg: impact.impactKg,
      paymentMode,
      paymentStatus: paymentMode === 'PAY' ? 'PENDING' : 'COMPLETED',
      merchantId,
      partnerId,
      giftCodeUsed: giftCode,
      weightGrams,
      multiplier,
      // Maturation tracking (5/45/50 Rule)
      immediateImpactKg: maturation.immediateKg,
      midTermImpactKg: maturation.midTermKg,
      finalImpactKg: maturation.finalKg,
      midTermMaturesAt: maturation.midTermMaturesAt,
      finalMaturesAt: maturation.finalMaturesAt,
    },
    include: {
      user: true,
      sku: true,
      merchant: true,
    },
  });

  // Mark gift code as USED if provided (for GIFT_CARD mode)
  if (giftCode && paymentMode === 'GIFT_CARD') {
    await prisma.giftCode.update({
      where: { code: giftCode },
      data: { status: 'USED', usedAt: new Date(), usedByUserId: userId },
    });
  }

  // Update wallet if payment is completed (for non-PAY modes)
  if (transaction.paymentStatus === 'COMPLETED') {
    await updateUserWallet(userId, transactionAmount, impact.impactKg);
  }

  // If merchant, add the merchant cost to their monthly billing balance
  // For CLAIM mode (merchant prepaid), this is what the merchant owes
  // For PAY mode, customer already paid, so merchant doesn't owe
  if (merchantId && (paymentMode === 'CLAIM' || paymentMode === 'ALLOCATION')) {
    await prisma.merchant.update({
      where: { id: merchantId },
      data: { currentBalance: { increment: merchantCost } },
    });
  }

  const response: ApiResponse<TransactionWithRelations & { impact: typeof impact }> = {
    success: true,
    data: { ...transaction, impact },
  };

  res.status(201).json(response);
});

// GET /api/transactions - List user's transactions
export const getUserTransactions = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const userId = req.user!.id;
  const { limit = '20', offset = '0' } = req.query;

  const transactions = await prisma.transaction.findMany({
    where: { userId },
    include: {
      sku: true,
      merchant: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: parseInt(limit as string),
    skip: parseInt(offset as string),
  });

  const total = await prisma.transaction.count({ where: { userId } });

  const response: ApiResponse<{ transactions: typeof transactions; total: number }> = {
    success: true,
    data: { transactions, total },
  };

  res.json(response);
});

// GET /api/transactions/all - List all transactions (admin)
export const getAllTransactions = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const { limit = '50', offset = '0', paymentMode, merchantId } = req.query;

  const where: Record<string, unknown> = {};
  if (paymentMode) where.paymentMode = paymentMode;
  if (merchantId) where.merchantId = merchantId;

  const transactions = await prisma.transaction.findMany({
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
    take: parseInt(limit as string),
    skip: parseInt(offset as string),
  });

  const total = await prisma.transaction.count({ where });

  const response: ApiResponse<{ transactions: typeof transactions; total: number }> = {
    success: true,
    data: { transactions, total },
  };

  res.json(response);
});

// GET /api/transactions/:id - Get single transaction
export const getTransaction = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const id = req.params.id as string;
  if (!id) throw badRequest('Transaction ID is required');
  const userId = req.user!.id;
  const isAdmin = req.user!.role === 'ADMIN';

  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: {
      user: true,
      sku: true,
      merchant: true,
    },
  });

  if (!transaction) {
    throw notFound('Transaction not found');
  }

  // Check permission (user can only see their own, admin can see all)
  if (!isAdmin && transaction.userId !== userId) {
    throw notFound('Transaction not found');
  }

  const response: ApiResponse<Transaction> = {
    success: true,
    data: transaction,
  };

  res.json(response);
});
