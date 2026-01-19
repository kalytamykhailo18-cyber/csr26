import { prisma } from '../lib/prisma.js';
import type { ImpactCalculation } from '../types/index.js';

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

  return {
    amount: amountEur,
    impactKg,
    impactGrams,
    displayValue,
    belowThreshold,
    thresholdProgress,
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

  return {
    amount: amountEur,
    impactKg,
    impactGrams,
    displayValue,
    belowThreshold,
    thresholdProgress,
  };
};

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

// Update user wallet after transaction
export const updateUserWallet = async (
  userId: string,
  amountEur: number,
  impactKg: number
): Promise<void> => {
  await prisma.user.update({
    where: { id: userId },
    data: {
      walletBalance: { increment: amountEur },
      walletImpactKg: { increment: impactKg },
    },
  });

  // Check if user should be upgraded
  await checkThresholdUpgrade(userId);
};
