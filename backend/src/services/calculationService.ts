import { prisma } from '../lib/prisma.js';
import type { ImpactCalculation, MaturationBreakdown, UserImpactSummary } from '../types/index.js';

// ============================================
// MATURATION CONSTANTS (5/45/50 Rule)
// ============================================

// Percentages for each maturation phase
const IMMEDIATE_PERCENT = 0.05;  // 5% immediate
const MIDTERM_PERCENT = 0.45;    // 45% at 40 weeks
const FINAL_PERCENT = 0.50;      // 50% at 80 weeks

// Weeks until maturation
const MIDTERM_WEEKS = 40;
const FINAL_WEEKS = 80;

// ============================================
// SETTING HELPERS
// ============================================

// Get setting value with default fallback
export const getSettingValue = async (key: string, defaultValue: string): Promise<string> => {
  const setting = await prisma.setting.findUnique({ where: { key } });
  return setting?.value ?? defaultValue;
};

// Get price per kg from settings (default €0.11)
export const getPricePerKg = async (): Promise<number> => {
  const value = await getSettingValue('PRICE_PER_KG', '0.11');
  return parseFloat(value);
};

// Get certification threshold from settings (default €10)
export const getCertificationThreshold = async (): Promise<number> => {
  const value = await getSettingValue('CERTIFICATION_THRESHOLD', '10');
  return parseFloat(value);
};

// ============================================
// MATURATION CALCULATIONS
// ============================================

// Calculate maturation breakdown for a given impact
export const calculateMaturationBreakdown = (impactKg: number, transactionDate: Date = new Date()): MaturationBreakdown => {
  const immediateKg = impactKg * IMMEDIATE_PERCENT;
  const midTermKg = impactKg * MIDTERM_PERCENT;
  const finalKg = impactKg * FINAL_PERCENT;

  // Calculate maturation dates
  const midTermDate = new Date(transactionDate);
  midTermDate.setDate(midTermDate.getDate() + MIDTERM_WEEKS * 7);

  const finalDate = new Date(transactionDate);
  finalDate.setDate(finalDate.getDate() + FINAL_WEEKS * 7);

  return {
    totalKg: impactKg,
    immediateKg,
    midTermKg,
    finalKg,
    midTermMaturesAt: midTermDate,
    finalMaturesAt: finalDate,
    immediatePercent: IMMEDIATE_PERCENT * 100,
    midTermPercent: MIDTERM_PERCENT * 100,
    finalPercent: FINAL_PERCENT * 100,
  };
};

// Calculate how much impact has matured for a transaction
export const calculateMaturedImpact = (
  immediateKg: number,
  midTermKg: number,
  finalKg: number,
  midTermMaturesAt: Date | null,
  finalMaturesAt: Date | null
): number => {
  const now = new Date();
  let matured = immediateKg; // 5% is always matured immediately

  if (midTermMaturesAt && now >= midTermMaturesAt) {
    matured += midTermKg; // Add 45% if matured
  }

  if (finalMaturesAt && now >= finalMaturesAt) {
    matured += finalKg; // Add 50% if matured
  }

  return matured;
};

// Calculate total matured impact for a user
export const calculateUserMaturedImpact = async (userId: string): Promise<UserImpactSummary> => {
  const now = new Date();

  // Get all completed transactions for the user
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      paymentStatus: 'COMPLETED',
    },
    select: {
      impactKg: true,
      immediateImpactKg: true,
      midTermImpactKg: true,
      finalImpactKg: true,
      midTermMaturesAt: true,
      finalMaturesAt: true,
      createdAt: true,
    },
  });

  let totalImpactKg = 0;
  let maturedImpactKg = 0;
  let pendingImpactKg = 0;

  for (const tx of transactions) {
    const impactKg = Number(tx.impactKg);
    totalImpactKg += impactKg;

    // If maturation fields are set, use them; otherwise calculate from total impact
    const immediate = tx.immediateImpactKg !== null ? Number(tx.immediateImpactKg) : impactKg * IMMEDIATE_PERCENT;
    const midTerm = tx.midTermImpactKg !== null ? Number(tx.midTermImpactKg) : impactKg * MIDTERM_PERCENT;
    const final = tx.finalImpactKg !== null ? Number(tx.finalImpactKg) : impactKg * FINAL_PERCENT;

    // Calculate maturation dates if not set
    const midTermDate = tx.midTermMaturesAt || new Date(tx.createdAt.getTime() + MIDTERM_WEEKS * 7 * 24 * 60 * 60 * 1000);
    const finalDate = tx.finalMaturesAt || new Date(tx.createdAt.getTime() + FINAL_WEEKS * 7 * 24 * 60 * 60 * 1000);

    // Add immediate impact (always matured)
    maturedImpactKg += immediate;

    // Check mid-term maturation
    if (now >= midTermDate) {
      maturedImpactKg += midTerm;
    } else {
      pendingImpactKg += midTerm;
    }

    // Check final maturation
    if (now >= finalDate) {
      maturedImpactKg += final;
    } else {
      pendingImpactKg += final;
    }
  }

  // Get next maturation events
  const upcomingMaturations = await prisma.transaction.findMany({
    where: {
      userId,
      paymentStatus: 'COMPLETED',
      OR: [
        { midTermMaturesAt: { gt: now } },
        { finalMaturesAt: { gt: now } },
      ],
    },
    select: {
      midTermImpactKg: true,
      finalImpactKg: true,
      midTermMaturesAt: true,
      finalMaturesAt: true,
    },
    orderBy: [
      { midTermMaturesAt: 'asc' },
    ],
    take: 3,
  });

  return {
    totalImpactKg,
    maturedImpactKg,
    pendingImpactKg,
    upcomingMaturations: upcomingMaturations.map(m => ({
      amount: m.midTermMaturesAt && m.midTermMaturesAt > now
        ? Number(m.midTermImpactKg)
        : Number(m.finalImpactKg),
      date: m.midTermMaturesAt && m.midTermMaturesAt > now
        ? m.midTermMaturesAt
        : m.finalMaturesAt!,
    })).filter(m => m.date !== null),
  };
};

// ============================================
// IMPACT CALCULATIONS
// ============================================

// Calculate impact from amount
// Formula: Impact (kg) = Amount (€) ÷ Price per kg
export const calculateImpact = async (amountEur: number): Promise<ImpactCalculation> => {
  const pricePerKg = await getPricePerKg();
  const threshold = await getCertificationThreshold();

  const impactKg = amountEur / pricePerKg;
  const impactGrams = impactKg * 1000;

  // Format display: below 1000g show grams, otherwise kg
  let displayValue: string;
  if (impactGrams < 1000) {
    displayValue = `${Math.round(impactGrams)}g`;
  } else {
    displayValue = `${impactKg.toFixed(2)} kg`;
  }

  const belowThreshold = amountEur < threshold;
  const thresholdProgress = Math.min((amountEur / threshold) * 100, 100);

  // Calculate maturation breakdown
  const maturation = calculateMaturationBreakdown(impactKg);

  return {
    amount: amountEur,
    impactKg,
    impactGrams,
    displayValue,
    belowThreshold,
    thresholdProgress,
    maturation,
  };
};

// Calculate impact from weight (for supermarket products)
// Formula: Impact = Weight (kg) × Multiplier
// Merchant cost = Weight (kg) × €0.11 × Multiplier
export const calculateWeightBasedImpact = async (
  weightGrams: number,
  multiplier: number = 1
): Promise<ImpactCalculation> => {
  const pricePerKg = await getPricePerKg();
  const threshold = await getCertificationThreshold();

  const weightKg = weightGrams / 1000;
  const impactKg = weightKg * multiplier;
  const impactGrams = impactKg * 1000;
  const amountEur = weightKg * pricePerKg * multiplier;

  // Format display
  let displayValue: string;
  if (impactGrams < 1000) {
    displayValue = `${Math.round(impactGrams)}g`;
  } else {
    displayValue = `${impactKg.toFixed(2)} kg`;
  }

  const belowThreshold = amountEur < threshold;
  const thresholdProgress = Math.min((amountEur / threshold) * 100, 100);

  // Calculate maturation breakdown
  const maturation = calculateMaturationBreakdown(impactKg);

  return {
    amount: amountEur,
    impactKg,
    impactGrams,
    displayValue,
    belowThreshold,
    thresholdProgress,
    maturation,
  };
};

// ============================================
// USER WALLET MANAGEMENT
// ============================================

// Check if user should be upgraded to CERTIFIED status
export const checkThresholdUpgrade = async (userId: string): Promise<boolean> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { walletBalance: true, status: true },
  });

  if (!user || user.status === 'CERTIFIED') {
    return false;
  }

  const threshold = await getCertificationThreshold();
  const balance = Number(user.walletBalance);

  if (balance >= threshold) {
    // Upgrade user to CERTIFIED
    await prisma.user.update({
      where: { id: userId },
      data: { status: 'CERTIFIED' },
    });
    return true;
  }

  return false;
};

// Update user wallet after transaction (with maturation tracking)
export const updateUserWallet = async (
  userId: string,
  amountEur: number,
  impactKg: number
): Promise<void> => {
  // Calculate maturation breakdown
  const maturation = calculateMaturationBreakdown(impactKg);

  await prisma.user.update({
    where: { id: userId },
    data: {
      walletBalance: { increment: amountEur },
      walletImpactKg: { increment: impactKg },
      // Add immediate 5% to matured impact
      maturedImpactKg: { increment: maturation.immediateKg },
      // Add remaining 95% to pending impact
      pendingImpactKg: { increment: maturation.midTermKg + maturation.finalKg },
    },
  });

  // Check if user should be upgraded
  await checkThresholdUpgrade(userId);
};

// Update a specific transaction with maturation data
export const updateTransactionMaturation = async (
  transactionId: string,
  impactKg: number
): Promise<void> => {
  const maturation = calculateMaturationBreakdown(impactKg);

  await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      immediateImpactKg: maturation.immediateKg,
      midTermImpactKg: maturation.midTermKg,
      finalImpactKg: maturation.finalKg,
      midTermMaturesAt: maturation.midTermMaturesAt,
      finalMaturesAt: maturation.finalMaturesAt,
    },
  });
};

// Process matured impacts (run periodically via cron)
export const processMaturedImpacts = async (): Promise<{ processed: number }> => {
  const now = new Date();

  // Find transactions where mid-term has just matured
  const midTermMatured = await prisma.transaction.findMany({
    where: {
      paymentStatus: 'COMPLETED',
      midTermMaturesAt: { lte: now },
      midTermImpactKg: { not: null },
    },
    select: {
      id: true,
      userId: true,
      midTermImpactKg: true,
    },
  });

  // Find transactions where final has just matured
  const finalMatured = await prisma.transaction.findMany({
    where: {
      paymentStatus: 'COMPLETED',
      finalMaturesAt: { lte: now },
      finalImpactKg: { not: null },
    },
    select: {
      id: true,
      userId: true,
      finalImpactKg: true,
    },
  });

  // Update user matured/pending impacts
  // Note: In production, this would be more sophisticated to avoid double-counting
  let processed = 0;

  for (const tx of midTermMatured) {
    const amount = Number(tx.midTermImpactKg);
    await prisma.user.update({
      where: { id: tx.userId },
      data: {
        maturedImpactKg: { increment: amount },
        pendingImpactKg: { decrement: amount },
      },
    });
    processed++;
  }

  for (const tx of finalMatured) {
    const amount = Number(tx.finalImpactKg);
    await prisma.user.update({
      where: { id: tx.userId },
      data: {
        maturedImpactKg: { increment: amount },
        pendingImpactKg: { decrement: amount },
      },
    });
    processed++;
  }

  return { processed };
};

// Format impact for display with bottle equivalent
export const formatImpactWithBottles = (impactKg: number): { kg: string; bottles: number; bottlesDisplay: string } => {
  // 1 kg of plastic ≈ 25 plastic bottles (average 40g per bottle)
  const BOTTLES_PER_KG = 25;

  const bottles = Math.round(impactKg * BOTTLES_PER_KG);
  const kg = impactKg >= 1 ? `${impactKg.toFixed(2)} kg` : `${Math.round(impactKg * 1000)}g`;

  let bottlesDisplay: string;
  if (bottles >= 1000) {
    bottlesDisplay = `${(bottles / 1000).toFixed(1)}k bottles`;
  } else {
    bottlesDisplay = `${bottles} bottles`;
  }

  return { kg, bottles, bottlesDisplay };
};
