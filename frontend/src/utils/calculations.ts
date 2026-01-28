// CSR26 Calculation Utilities
// Impact calculation formulas from requirements
// RULE: Impact (kg) = Amount (EUR) / Price per kg (default 0.11)
// RULE: Weight-based: Merchant cost = Weight (kg) x Price per kg x Multiplier

import type { ImpactCalculation, LandingCase, Sku, LandingParams } from '../types';

// Default values (should come from settings in real usage)
const DEFAULT_PRICE_PER_KG = 0.11;
const DEFAULT_CERTIFICATION_THRESHOLD = 10;

/**
 * Calculate impact from EUR amount
 * Impact (kg) = Amount (EUR) / Price per kg
 */
export const calculateImpact = (
  amount: number,
  pricePerKg: number = DEFAULT_PRICE_PER_KG,
  threshold: number = DEFAULT_CERTIFICATION_THRESHOLD
): ImpactCalculation => {
  const impactKg = amount / pricePerKg;
  const impactGrams = impactKg * 1000;

  // Format display value based on size
  // Below 1000g: show in grams, 1000g+: show in kg
  let displayValue: string;
  if (impactGrams < 1000) {
    displayValue = `${Math.round(impactGrams)}g`;
  } else {
    displayValue = `${impactKg.toFixed(2)} kg`;
  }

  const belowThreshold = amount < threshold;
  const thresholdProgress = Math.min((amount / threshold) * 100, 100);

  return {
    amount,
    impactKg,
    impactGrams,
    displayValue,
    belowThreshold,
    thresholdProgress,
  };
};

/**
 * Calculate impact from weight (for weight-based products)
 * Impact = Weight (g) x Multiplier / 1000 (to get kg)
 * Merchant cost = Weight (kg) x Price per kg x Multiplier
 */
export const calculateWeightBasedImpact = (
  weightGrams: number,
  multiplier: number = 1,
  pricePerKg: number = DEFAULT_PRICE_PER_KG
): { impactKg: number; impactGrams: number; displayValue: string; merchantCost: number } => {
  const weightKg = weightGrams / 1000;
  const impactKg = weightKg * multiplier;
  const impactGrams = impactKg * 1000;
  const merchantCost = weightKg * pricePerKg * multiplier;

  // Format display value
  let displayValue: string;
  if (impactGrams < 1000) {
    displayValue = `${Math.round(impactGrams)}g`;
  } else {
    displayValue = `${impactKg.toFixed(2)} kg`;
  }

  return {
    impactKg,
    impactGrams,
    displayValue,
    merchantCost,
  };
};

/**
 * Determine the landing case (A-F, ADMIN) based on SKU and URL params
 * See requirements.md for case definitions
 */
export const determineLandingCase = (
  sku: Sku | null,
  params: LandingParams
): LandingCase => {
  // Case ADMIN: Admin login via special SKU code (e.g., ADMIN-ACCESS-2026)
  // Check URL param first before SKU lookup (SKU may not exist in database)
  if (params.sku && params.sku.toUpperCase().startsWith('ADMIN-')) {
    return 'ADMIN';
  }

  // Case F: GENERAL - No SKU, direct marketing link
  if (!sku && !params.sku) {
    return 'F';
  }

  // If no SKU found but code was provided, treat as general
  if (!sku) {
    return 'F';
  }

  // Case E: ALLOCATION - E-commerce integration with pre-filled data
  if (sku.paymentMode === 'ALLOCATION' || params.partner) {
    return 'E';
  }

  // Case D: GIFT_CARD - Physical gift card requiring code validation
  if (sku.paymentMode === 'GIFT_CARD' || sku.validationRequired) {
    return 'D';
  }

  // Case C: PAY - Customer pays
  if (sku.paymentMode === 'PAY' || sku.paymentRequired) {
    return 'C';
  }

  // Case A or B: CLAIM - Merchant prepaid/funded
  if (sku.paymentMode === 'CLAIM') {
    // Case A: Merchant prepaid (supermarket products) - has weight
    if (sku.weightGrams && sku.weightGrams > 0) {
      return 'A';
    }
    // Case B: Merchant funded accumulation - has amount
    if (params.amount && params.amount > 0) {
      return 'B';
    }
    // Default CLAIM is Case A
    return 'A';
  }

  // Default to general
  return 'F';
};

/**
 * Determine which form type to show based on case and amount
 * minimal: email only (CLAIM below €10)
 * standard: firstName, lastName, email, terms (PAY, ALLOCATION below €10)
 * full: complete form (GIFT_CARD, €10+)
 */
export const determineFormType = (
  landingCase: LandingCase,
  amount: number,
  threshold: number = DEFAULT_CERTIFICATION_THRESHOLD
): 'minimal' | 'standard' | 'full' => {
  // Full form for €10+ regardless of case
  if (amount >= threshold) {
    return 'full';
  }

  // GIFT_CARD always requires full form
  if (landingCase === 'D') {
    return 'full';
  }

  // CLAIM cases (A, B) use minimal form below threshold
  if (landingCase === 'A' || landingCase === 'B') {
    return 'minimal';
  }

  // PAY, ALLOCATION, GENERAL use standard form below threshold
  return 'standard';
};

/**
 * Get the appropriate message text based on case and threshold
 */
export const getLandingMessage = (
  landingCase: LandingCase,
  amount: number,
  displayImpact: string,
  threshold: number = DEFAULT_CERTIFICATION_THRESHOLD
): { title: string; message: string } => {
  const belowThreshold = amount < threshold;

  switch (landingCase) {
    case 'A':
      return {
        title: 'Plastic Certification Path',
        message: 'This product line follows a plastic certification path. The Merchant has already activated verified waste removal. Want to do your part? Start your personal journey too.',
      };

    case 'B':
      if (belowThreshold) {
        return {
          title: 'Environmental Accumulation',
          message: `The Merchant has funded your accrual for the removal of ${displayImpact} of plastic. Upon reaching €${threshold}, your credits will become a certified asset in your name.`,
        };
      }
      return {
        title: 'Certified Environmental Asset',
        message: `The Merchant has purchased real assets for the removal of ${displayImpact} of plastic for you. You now have a certified and auditable title.`,
      };

    case 'C':
    case 'F':
      if (belowThreshold) {
        return {
          title: 'Start Your Environmental Journey',
          message: `Great choice. With your contribution of €${amount.toFixed(2)}, you have started your accrual path for the removal of ${displayImpact} of plastic. Upon reaching the €${threshold} threshold, you will redeem your first certified environmental assets.`,
        };
      }
      return {
        title: 'Certified Environmental Asset',
        message: `Great choice. With your contribution of €${amount.toFixed(2)}, you have purchased real environmental assets for the removal of ${displayImpact} of plastic. Your title is now auditable and guaranteed by the CPRS protocol.`,
      };

    case 'D':
      return {
        title: 'Gift Card Redemption',
        message: `Code Validated. You have redeemed an industrial value of ${displayImpact} of plastic removed. Your credits are now in the maturation system to become a final asset.`,
      };

    case 'E':
      return {
        title: 'Thank You!',
        message: `With this purchase, you just removed ${displayImpact} of plastic from the ocean.`,
      };

    default:
      return {
        title: 'Environmental Impact',
        message: `Your contribution helps remove ${displayImpact} of plastic.`,
      };
  }
};

/**
 * Calculate the amount from SKU and params
 */
export const calculateAmount = (
  sku: Sku | null,
  params: LandingParams,
  pricePerKg: number = DEFAULT_PRICE_PER_KG
): number => {
  // URL param amount takes precedence
  if (params.amount && params.amount > 0) {
    return params.amount;
  }

  // SKU price
  if (sku?.price && sku.price > 0) {
    return Number(sku.price);
  }

  // Weight-based calculation
  if (params.weight && params.weight > 0) {
    const multiplier = params.multiplier || sku?.multiplier || 1;
    const weightKg = params.weight / 1000;
    return weightKg * pricePerKg * multiplier;
  }

  if (sku?.weightGrams && sku.weightGrams > 0) {
    const multiplier = sku.multiplier || 1;
    const weightKg = sku.weightGrams / 1000;
    return weightKg * pricePerKg * multiplier;
  }

  // Default to 0 (user will select amount)
  return 0;
};
