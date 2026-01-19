import { Request, Response, NextFunction } from 'express';
import { asyncHandler, badRequest, notFound } from '../middleware/errorHandler.js';
import { prisma } from '../lib/prisma.js';
import type { ApiResponse, Setting, SettingsMap } from '../types/index.js';

// GET /api/settings - Get all settings (public)
export const getAllSettings = asyncHandler(async (_req: Request, res: Response, _next: NextFunction) => {
  const settings = await prisma.setting.findMany();

  // Convert to map for easier frontend use
  const settingsMap: SettingsMap = settings.reduce<SettingsMap>((acc, setting) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {} as SettingsMap);

  const response: ApiResponse<SettingsMap> = {
    success: true,
    data: settingsMap,
  };

  res.json(response);
});

// GET /api/settings/:key - Get single setting (public)
export const getSetting = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const key = req.params.key as string;
  if (!key) throw badRequest('Key is required');

  const setting = await prisma.setting.findUnique({
    where: { key },
  });

  if (!setting) {
    throw notFound('Setting not found');
  }

  const response: ApiResponse<Setting> = {
    success: true,
    data: setting,
  };

  res.json(response);
});

// PUT /api/settings/:key - Update setting (admin only)
export const updateSetting = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const key = req.params.key as string;
  if (!key) throw badRequest('Key is required');
  const { value, description } = req.body;

  if (value === undefined) {
    throw badRequest('Value is required');
  }

  const setting = await prisma.setting.upsert({
    where: { key },
    update: { value, description },
    create: { key, value, description },
  });

  const response: ApiResponse<Setting> = {
    success: true,
    data: setting,
  };

  res.json(response);
});
