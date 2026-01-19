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
