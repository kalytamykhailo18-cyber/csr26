import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { unauthorized, forbidden } from './errorHandler.js';
import { prisma } from '../lib/prisma.js';
import type { User, UserRole } from '@prisma/client';

// JWT Secret from environment - NEVER hardcoded
// Production MUST have JWT_SECRET set for security
const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'development-secret-change-in-production');

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required in production');
}

// Token payload interface
export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
      token?: string;
    }
  }
}

// Generate JWT token
export const generateToken = (payload: TokenPayload): string => {
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as jwt.SignOptions);
};

// Verify JWT token
export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
};

// Auth middleware - requires valid token
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log('[AUTH] Authenticating request to:', req.method, req.path);
    console.log('[AUTH] Has Authorization header:', !!req.headers.authorization);
    console.log('[AUTH] Has token in query:', !!req.query.token);

    // Get token from header or query parameter (for CSV exports with window.open)
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      console.log('[AUTH] Token from header:', token?.substring(0, 20) + '...');
    } else if (req.query.token && typeof req.query.token === 'string') {
      // Allow token from query parameter for CSV export downloads
      token = req.query.token;
      console.log('[AUTH] Token from query:', token?.substring(0, 20) + '...');
    }

    if (!token) {
      console.log('[AUTH] No token provided');
      throw unauthorized('No token provided');
    }

    req.token = token;

    // Verify token
    const payload = verifyToken(token);
    console.log('[AUTH] Token verified for user:', payload.email);

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      console.log('[AUTH] User not found:', payload.userId);
      throw unauthorized('User not found');
    }

    console.log('[AUTH] Authentication successful for:', user.email);
    req.user = user;
    next();
  } catch (error) {
    console.error('[AUTH] Authentication failed:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      next(unauthorized('Invalid token'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(unauthorized('Token expired'));
    } else {
      next(error);
    }
  }
};

// Optional auth - doesn't fail if no token
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    req.token = token;

    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (user) {
      req.user = user;
    }

    next();
  } catch {
    // Silently ignore auth errors for optional auth
    next();
  }
};

// Role-based authorization middleware
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(unauthorized('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(forbidden('Insufficient permissions'));
    }

    next();
  };
};

// Admin only middleware
export const adminOnly = authorize('ADMIN');

// Merchant or Admin middleware
export const merchantOrAdmin = authorize('MERCHANT', 'ADMIN');
