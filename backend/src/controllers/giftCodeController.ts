import { Request, Response, NextFunction } from 'express';
import { asyncHandler, badRequest, notFound } from '../middleware/errorHandler.js';
import { prisma } from '../lib/prisma.js';
import { calculateImpact } from '../services/calculationService.js';
import type { ApiResponse, ValidateGiftCodeRequest, ValidateGiftCodeResponse, BatchUploadGiftCodesRequest, GiftCode } from '../types/index.js';

// POST /api/gift-codes/validate - Validate a gift code
export const validateGiftCode = asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  const { code, skuCode }: ValidateGiftCodeRequest = req.body;

  if (!code || !skuCode) {
    throw badRequest('Code and skuCode are required');
  }

  // Find gift code
  const giftCode = await prisma.giftCode.findUnique({
    where: { code },
    include: { sku: true },
  });

  if (!giftCode) {
    const response: ApiResponse<ValidateGiftCodeResponse> = {
      success: true,
      data: {
        valid: false,
        message: 'Invalid gift code',
      },
    };
    res.json(response);
    return;
  }

  // Check if code matches SKU
  if (giftCode.skuCode !== skuCode) {
    const response: ApiResponse<ValidateGiftCodeResponse> = {
      success: true,
      data: {
        valid: false,
        message: 'Code does not match this product',
      },
    };
    res.json(response);
    return;
  }

  // Check if already used
  if (giftCode.status !== 'UNUSED') {
    const response: ApiResponse<ValidateGiftCodeResponse> = {
      success: true,
      data: {
        valid: false,
        message: giftCode.status === 'USED' ? 'Code already used' : 'Code deactivated',
      },
    };
    res.json(response);
    return;
  }

  // Calculate impact for the gift card amount
  const amount = Number(giftCode.sku.price);
  const impact = await calculateImpact(amount);

  const response: ApiResponse<ValidateGiftCodeResponse> = {
    success: true,
    data: {
      valid: true,
      amount,
      impactKg: impact.impactKg,
      message: `Code valid for €${amount} (${impact.displayValue} plastic removal)`,
    },
  };

  res.json(response);
});

// GET /api/gift-codes - List all gift codes (admin)
export const getAllGiftCodes = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const { status, skuCode, limit = '50', offset = '0' } = req.query;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (skuCode) where.skuCode = skuCode;

  const giftCodes = await prisma.giftCode.findMany({
    where,
    include: {
      sku: {
        select: { code: true, name: true, price: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: parseInt(limit as string),
    skip: parseInt(offset as string),
  });

  const total = await prisma.giftCode.count({ where });

  const response: ApiResponse<{ giftCodes: typeof giftCodes; total: number }> = {
    success: true,
    data: { giftCodes, total },
  };

  res.json(response);
});

// POST /api/gift-codes/batch - Upload batch of gift codes (admin)
export const batchUpload = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const { skuCode, codes }: BatchUploadGiftCodesRequest = req.body;

  if (!skuCode || !codes || !Array.isArray(codes) || codes.length === 0) {
    throw badRequest('skuCode and codes array are required');
  }

  // Check if SKU exists and is a gift card type
  const sku = await prisma.sku.findUnique({ where: { code: skuCode } });
  if (!sku) {
    throw notFound('SKU not found');
  }

  if (sku.paymentMode !== 'GIFT_CARD') {
    throw badRequest('SKU must be a GIFT_CARD type');
  }

  // Filter out any existing codes
  const existingCodes = await prisma.giftCode.findMany({
    where: { code: { in: codes } },
    select: { code: true },
  });
  const existingSet = new Set(existingCodes.map((c) => c.code));
  const newCodes = codes.filter((c) => !existingSet.has(c));

  if (newCodes.length === 0) {
    throw badRequest('All codes already exist');
  }

  // Create new codes
  await prisma.giftCode.createMany({
    data: newCodes.map((code) => ({ code, skuCode })),
  });

  const response: ApiResponse<{ created: number; skipped: number }> = {
    success: true,
    data: {
      created: newCodes.length,
      skipped: codes.length - newCodes.length,
    },
  };

  res.status(201).json(response);
});

// DELETE /api/gift-codes/:code - Deactivate a gift code (admin)
export const deactivateGiftCode = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const codeParam = req.params.code;
  if (!codeParam) throw badRequest('Code is required');
  const code = Array.isArray(codeParam) ? codeParam[0] : codeParam;

  const giftCode = await prisma.giftCode.findUnique({ where: { code } });
  if (!giftCode) {
    throw notFound('Gift code not found');
  }

  if (giftCode.status === 'USED') {
    throw badRequest('Cannot deactivate an already used code');
  }

  const updatedGiftCode = await prisma.giftCode.update({
    where: { code },
    data: { status: 'DEACTIVATED' },
  });

  const response: ApiResponse<GiftCode> = {
    success: true,
    data: updatedGiftCode,
  };

  res.json(response);
});

// PATCH /api/gift-codes/:code/activate - Activate a deactivated gift code (admin)
export const activateGiftCode = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const codeParam = req.params.code;
  if (!codeParam) throw badRequest('Code is required');
  const code = Array.isArray(codeParam) ? codeParam[0] : codeParam;

  const giftCode = await prisma.giftCode.findUnique({ where: { code } });
  if (!giftCode) {
    throw notFound('Gift code not found');
  }

  if (giftCode.status === 'USED') {
    throw badRequest('Cannot activate an already used code');
  }

  if (giftCode.status === 'UNUSED') {
    throw badRequest('Code is already active');
  }

  const updatedGiftCode = await prisma.giftCode.update({
    where: { code },
    data: { status: 'UNUSED' },
  });

  const response: ApiResponse<GiftCode> = {
    success: true,
    data: updatedGiftCode,
  };

  res.json(response);
});
