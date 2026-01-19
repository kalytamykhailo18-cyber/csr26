import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { prisma } from '../lib/prisma.js';
import { getCertificationThreshold } from '../services/calculationService.js';
import type { ApiResponse, WalletSummary } from '../types/index.js';

// GET /api/wallet - Get user's wallet summary
export const getWallet = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const userId = req.user!.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      walletBalance: true,
      walletImpactKg: true,
      status: true,
      _count: {
        select: { transactions: true },
      },
    },
  });

  const threshold = await getCertificationThreshold();
  const balance = Number(user!.walletBalance);
  const thresholdProgress = Math.min((balance / threshold) * 100, 100);

  const walletSummary: WalletSummary = {
    balance,
    impactKg: Number(user!.walletImpactKg),
    status: user!.status,
    transactionCount: user!._count.transactions,
    thresholdProgress,
  };

  const response: ApiResponse<WalletSummary> = {
    success: true,
    data: walletSummary,
  };

  res.json(response);
});

// GET /api/wallet/email/:email - Get wallet summary by email (public, for landing page)
export const getWalletByEmail = asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  const email = req.params.email as string;

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      walletBalance: true,
      walletImpactKg: true,
      status: true,
      _count: {
        select: { transactions: true },
      },
    },
  });

  if (!user) {
    // Return empty wallet for new users
    const response: ApiResponse<WalletSummary> = {
      success: true,
      data: {
        balance: 0,
        impactKg: 0,
        status: 'ACCUMULATION',
        transactionCount: 0,
        thresholdProgress: 0,
      },
    };
    res.json(response);
    return;
  }

  const threshold = await getCertificationThreshold();
  const balance = Number(user.walletBalance);
  const thresholdProgress = Math.min((balance / threshold) * 100, 100);

  const walletSummary: WalletSummary = {
    balance,
    impactKg: Number(user.walletImpactKg),
    status: user.status,
    transactionCount: user._count.transactions,
    thresholdProgress,
  };

  const response: ApiResponse<WalletSummary> = {
    success: true,
    data: walletSummary,
  };

  res.json(response);
});

// GET /api/wallet/history - Get wallet transaction history
export const getWalletHistory = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const userId = req.user!.id;
  const { limit = '20', offset = '0' } = req.query;

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      paymentStatus: 'COMPLETED',
    },
    select: {
      id: true,
      amount: true,
      impactKg: true,
      paymentMode: true,
      createdAt: true,
      sku: {
        select: { name: true },
      },
      merchant: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: parseInt(limit as string),
    skip: parseInt(offset as string),
  });

  const response: ApiResponse<typeof transactions> = {
    success: true,
    data: transactions,
  };

  res.json(response);
});
