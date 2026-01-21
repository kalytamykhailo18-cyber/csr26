import { Request, Response, NextFunction } from 'express';
import { asyncHandler, notFound } from '../middleware/errorHandler.js';
import { prisma } from '../lib/prisma.js';
import {
  getCertificationThreshold,
  calculateUserMaturedImpact,
  formatImpactWithBottles,
} from '../services/calculationService.js';
import type { ApiResponse, WalletSummary } from '../types/index.js';

// GET /api/wallet - Get current user's wallet
export const getWallet = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const userId = req.user!.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      walletBalance: true,
      walletImpactKg: true,
      maturedImpactKg: true,
      pendingImpactKg: true,
      status: true,
      _count: { select: { transactions: true } },
    },
  });

  if (!user) {
    throw notFound('User not found');
  }

  const threshold = await getCertificationThreshold();
  const balance = Number(user.walletBalance);
  const impactKg = Number(user.walletImpactKg);

  // Calculate matured impact from transactions (more accurate)
  const impactSummary = await calculateUserMaturedImpact(userId);

  // Calculate bottle equivalent
  const { bottles } = formatImpactWithBottles(impactSummary.maturedImpactKg);

  const walletSummary: WalletSummary = {
    balance,
    impactKg,
    maturedImpactKg: impactSummary.maturedImpactKg,
    pendingImpactKg: impactSummary.pendingImpactKg,
    bottles,
    status: user.status,
    transactionCount: user._count.transactions,
    thresholdProgress: Math.min((balance / threshold) * 100, 100),
    upcomingMaturations: impactSummary.upcomingMaturations.map(m => ({
      amount: m.amount,
      date: m.date.toISOString(),
    })),
  };

  const response: ApiResponse<WalletSummary> = {
    success: true,
    data: walletSummary,
  };

  res.json(response);
});

// GET /api/wallet/email/:email - Get wallet by email (for landing page)
export const getWalletByEmail = asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  const email = req.params.email as string;

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      walletBalance: true,
      walletImpactKg: true,
      maturedImpactKg: true,
      pendingImpactKg: true,
      status: true,
      _count: { select: { transactions: true } },
    },
  });

  if (!user) {
    // Return empty wallet for new users
    const response: ApiResponse<WalletSummary> = {
      success: true,
      data: {
        balance: 0,
        impactKg: 0,
        maturedImpactKg: 0,
        pendingImpactKg: 0,
        bottles: 0,
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
  const impactKg = Number(user.walletImpactKg);

  // Calculate matured impact from transactions
  const impactSummary = await calculateUserMaturedImpact(user.id);

  // Calculate bottle equivalent
  const { bottles } = formatImpactWithBottles(impactSummary.maturedImpactKg);

  const walletSummary: WalletSummary = {
    balance,
    impactKg,
    maturedImpactKg: impactSummary.maturedImpactKg,
    pendingImpactKg: impactSummary.pendingImpactKg,
    bottles,
    status: user.status,
    transactionCount: user._count.transactions,
    thresholdProgress: Math.min((balance / threshold) * 100, 100),
    upcomingMaturations: impactSummary.upcomingMaturations.map(m => ({
      amount: m.amount,
      date: m.date.toISOString(),
    })),
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
      immediateImpactKg: true,
      midTermImpactKg: true,
      finalImpactKg: true,
      midTermMaturesAt: true,
      finalMaturesAt: true,
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
