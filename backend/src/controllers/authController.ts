import { Request, Response, NextFunction } from 'express';
import { asyncHandler, badRequest, notFound } from '../middleware/errorHandler.js';
import { prisma } from '../lib/prisma.js';
import { generateToken } from '../middleware/auth.js';
import { sendMagicLinkEmail } from '../services/emailService.js';
import type { ApiResponse, AuthResponse, LandingFormData } from '../types/index.js';
import crypto from 'crypto';

// POST /api/auth/register - Create new user (from landing page form)
export const register = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const formData: LandingFormData = req.body;

  if (!formData.email) {
    throw badRequest('Email is required');
  }

  // Check if user exists
  let user = await prisma.user.findUnique({
    where: { email: formData.email },
  });

  if (user) {
    // Update existing user with any new data
    user = await prisma.user.update({
      where: { email: formData.email },
      data: {
        firstName: formData.firstName || user.firstName,
        lastName: formData.lastName || user.lastName,
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth) : user.dateOfBirth,
        street: formData.street || user.street,
        city: formData.city || user.city,
        postalCode: formData.postalCode || user.postalCode,
        country: formData.country || user.country,
        state: formData.state || user.state,
      },
    });
  } else {
    // Create new user
    user = await prisma.user.create({
      data: {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth) : null,
        street: formData.street,
        city: formData.city,
        postalCode: formData.postalCode,
        country: formData.country,
        state: formData.state,
      },
    });
  }

  // Generate token for auto-login
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  const response: ApiResponse<AuthResponse> = {
    success: true,
    data: { user, token },
  };

  res.status(201).json(response);
});

// POST /api/auth/magic-link - Send magic link email
export const sendMagicLink = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const { email } = req.body;

  if (!email) {
    throw badRequest('Email is required');
  }

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw notFound('User not found');
  }

  // Generate magic link token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  // Save magic link
  await prisma.magicLink.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  });

  // LOG MAGIC LINK FOR PM2 LOGS
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  console.log('========================================');
  console.log('MAGIC LINK GENERATED');
  console.log('Email:', email);
  console.log('Token:', token);
  console.log('URL:', `${frontendUrl}/auth/verify/${token}`);
  console.log('Expires:', expiresAt.toISOString());
  console.log('========================================');

  // Send magic link email (uses nodemailer if configured, or logs to console in development)
  const emailResult = await sendMagicLinkEmail(
    user.email,
    token,
    user.firstName || undefined
  );

  const response: ApiResponse<{ message: string; magicLinkUrl?: string }> = {
    success: true,
    data: {
      message: emailResult.message,
      // Only include magic link URL in development mode when email is not configured
      ...(emailResult.magicLinkUrl && { magicLinkUrl: emailResult.magicLinkUrl }),
    },
  };

  res.json(response);
});

// GET /api/auth/verify/:token - Verify magic link token
export const verifyMagicLink = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const tokenParam = req.params.token;

  if (!tokenParam) {
    throw badRequest('Token is required');
  }

  const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam;

  // Find magic link
  const magicLink = await prisma.magicLink.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!magicLink) {
    throw notFound('Invalid or expired token');
  }

  if (magicLink.used) {
    throw badRequest('Magic link already used');
  }

  if (magicLink.expiresAt < new Date()) {
    throw badRequest('Magic link expired');
  }

  // Mark as used
  await prisma.magicLink.update({
    where: { token },
    data: { used: true },
  });

  // Get user separately for proper typing
  const user = await prisma.user.findUnique({
    where: { id: magicLink.userId },
  });

  if (!user) {
    throw notFound('User not found');
  }

  // Generate JWT
  const jwtToken = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  const response: ApiResponse<AuthResponse> = {
    success: true,
    data: { user, token: jwtToken },
  };

  res.json(response);
});

// GET /api/auth/me - Get current user
export const getCurrentUser = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const response: ApiResponse<{ user: typeof req.user }> = {
    success: true,
    data: { user: req.user! },
  };

  res.json(response);
});

// POST /api/auth/admin-login - Admin login via secret code (from landing page)
// Requirements: Admin accesses via landing?sku=ADMIN-ACCESS-2026 with secret code validation
export const adminLogin = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const { secretCode } = req.body;

  if (!secretCode) {
    throw badRequest('Secret code is required');
  }

  // Get admin secret code from settings
  const adminSecretSetting = await prisma.setting.findUnique({
    where: { key: 'ADMIN_SECRET_CODE' },
  });

  if (!adminSecretSetting) {
    // If no admin secret is configured, deny access
    throw badRequest('Admin access not configured');
  }

  // Validate secret code
  if (secretCode !== adminSecretSetting.value) {
    throw badRequest('Invalid secret code');
  }

  // Find or create admin user
  // Use a specific admin email from settings or default
  const adminEmailSetting = await prisma.setting.findUnique({
    where: { key: 'ADMIN_EMAIL' },
  });

  const adminEmail = adminEmailSetting?.value || 'admin@csr26.it';

  let adminUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!adminUser) {
    // Create admin user
    adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
      },
    });
  } else if (adminUser.role !== 'ADMIN') {
    // Upgrade user to admin if not already
    adminUser = await prisma.user.update({
      where: { id: adminUser.id },
      data: { role: 'ADMIN' },
    });
  }

  // Generate token
  const token = generateToken({
    userId: adminUser.id,
    email: adminUser.email,
    role: adminUser.role,
  });

  const response: ApiResponse<AuthResponse> = {
    success: true,
    data: { user: adminUser, token },
  };

  res.json(response);
});
