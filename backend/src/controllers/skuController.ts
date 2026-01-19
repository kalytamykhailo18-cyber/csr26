import { Request, Response, NextFunction } from 'express';
import { asyncHandler, badRequest, notFound } from '../middleware/errorHandler.js';
import { prisma } from '../lib/prisma.js';
import type { ApiResponse, Sku } from '../types/index.js';

// GET /api/skus/:code - Get SKU by code (public)
export const getSkuByCode = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const code = req.params.code as string;
  if (!code) throw badRequest('Code is required');

  const sku = await prisma.sku.findUnique({
    where: { code, active: true },
    include: {
      merchant: {
        select: {
          id: true,
          name: true,
          multiplier: true,
        },
      },
    },
  });

  if (!sku) {
    throw notFound('SKU not found');
  }

  const response: ApiResponse<typeof sku> = {
    success: true,
    data: sku,
  };

  res.json(response);
});

// GET /api/skus - List all SKUs (admin only)
export const getAllSkus = asyncHandler(async (_req: Request, res: Response, _next: NextFunction) => {
  const skus = await prisma.sku.findMany({
    include: {
      merchant: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const response: ApiResponse<typeof skus> = {
    success: true,
    data: skus,
  };

  res.json(response);
});

// POST /api/skus - Create new SKU (admin only)
export const createSku = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const {
    code,
    name,
    description,
    paymentMode,
    price,
    weightGrams,
    multiplier,
    paymentRequired,
    validationRequired,
    merchantId,
  } = req.body;

  if (!code || !name || !paymentMode) {
    throw badRequest('Code, name, and paymentMode are required');
  }

  // Check if code already exists
  const existing = await prisma.sku.findUnique({ where: { code } });
  if (existing) {
    throw badRequest('SKU code already exists');
  }

  const sku = await prisma.sku.create({
    data: {
      code,
      name,
      description,
      paymentMode,
      price: price || 0,
      weightGrams,
      multiplier: multiplier || 1,
      paymentRequired: paymentRequired || false,
      validationRequired: validationRequired || false,
      merchantId,
    },
  });

  const response: ApiResponse<Sku> = {
    success: true,
    data: sku,
  };

  res.status(201).json(response);
});

// PUT /api/skus/:code - Update SKU (admin only)
export const updateSku = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const code = req.params.code as string;
  if (!code) throw badRequest('Code is required');
  const updateData = req.body;

  // Check if SKU exists
  const existing = await prisma.sku.findUnique({ where: { code } });
  if (!existing) {
    throw notFound('SKU not found');
  }

  const sku = await prisma.sku.update({
    where: { code },
    data: updateData,
  });

  const response: ApiResponse<Sku> = {
    success: true,
    data: sku,
  };

  res.json(response);
});

// DELETE /api/skus/:code - Delete SKU (soft delete - set inactive)
export const deleteSku = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const code = req.params.code as string;
  if (!code) throw badRequest('Code is required');

  // Check if SKU exists
  const existing = await prisma.sku.findUnique({ where: { code } });
  if (!existing) {
    throw notFound('SKU not found');
  }

  // Soft delete - just mark as inactive
  await prisma.sku.update({
    where: { code },
    data: { active: false },
  });

  const response: ApiResponse<{ message: string }> = {
    success: true,
    data: { message: 'SKU deactivated' },
  };

  res.json(response);
});
