// CSR26 User Controller
// Admin endpoints for user management
// DATA FLOW: Request → Controller → Prisma → DB → Response

import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { User, UserStatus, Prisma } from '@prisma/client';

// GET /api/users - List all users
export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      search,
      status,
      limit = '50',
      offset = '0',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build where clause
    const where: Prisma.UserWhereInput = {};

    if (search && typeof search === 'string') {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status && typeof status === 'string' && (status === 'ACCUMULATION' || status === 'CERTIFIED')) {
      where.status = status as UserStatus;
    }

    // Validate sortBy
    const validSortFields = ['createdAt', 'email', 'walletBalance', 'walletImpactKg', 'status'];
    const sortField = validSortFields.includes(sortBy as string) ? sortBy as string : 'createdAt';
    const order = sortOrder === 'asc' ? 'asc' : 'desc';

    // Get total count
    const total = await prisma.user.count({ where });

    // Get users
    const users = await prisma.user.findMany({
      where,
      include: {
        _count: {
          select: { transactions: true },
        },
      },
      orderBy: { [sortField]: order },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    res.json({
      success: true,
      data: {
        users,
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/:id - Get single user
export const getUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            sku: true,
            merchant: true,
          },
        },
        _count: {
          select: { transactions: true },
        },
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: { message: 'User not found' },
      });
      return;
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/users/:id - Update user
export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const {
      firstName,
      lastName,
      dateOfBirth,
      street,
      city,
      postalCode,
      country,
      state,
      status,
      corsairExported,
    } = req.body;

    // Check user exists
    const existingUser = await prisma.user.findUnique({ where: { id: id } });
    if (!existingUser) {
      res.status(404).json({
        success: false,
        error: { message: 'User not found' },
      });
      return;
    }

    // Build update data
    const updateData: Prisma.UserUpdateInput = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (street !== undefined) updateData.street = street;
    if (city !== undefined) updateData.city = city;
    if (postalCode !== undefined) updateData.postalCode = postalCode;
    if (country !== undefined) updateData.country = country;
    if (state !== undefined) updateData.state = state;
    if (status !== undefined && (status === 'ACCUMULATION' || status === 'CERTIFIED')) {
      updateData.status = status;
    }
    if (corsairExported !== undefined) updateData.corsairExported = corsairExported;

    const user = await prisma.user.update({
      where: { id: id },
      data: updateData,
    });

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/users/:id/adjust-wallet - Manually adjust user wallet
export const adjustWallet = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { amount, reason } = req.body;

    // Validate amount
    if (typeof amount !== 'number' || isNaN(amount)) {
      res.status(400).json({
        success: false,
        error: { message: 'Amount must be a valid number' },
      });
      return;
    }

    // Validate reason
    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: { message: 'Reason is required for wallet adjustment' },
      });
      return;
    }

    // Check user exists
    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      res.status(404).json({
        success: false,
        error: { message: 'User not found' },
      });
      return;
    }

    // Calculate impact based on amount (using default rate)
    const pricePerKgSetting = await prisma.setting.findUnique({
      where: { key: 'PRICE_PER_KG' },
    });
    const pricePerKg = pricePerKgSetting ? parseFloat(pricePerKgSetting.value) : 0.11;
    const impactKg = amount / pricePerKg;

    // Update user wallet
    const user = await prisma.user.update({
      where: { id },
      data: {
        walletBalance: { increment: amount },
        walletImpactKg: { increment: impactKg },
      },
    });

    // Create adjustment transaction record
    await prisma.transaction.create({
      data: {
        userId: id,
        amount: amount,
        impactKg: impactKg,
        paymentMode: 'CLAIM', // Manual adjustment treated as CLAIM
        paymentStatus: 'COMPLETED',
        masterId: 'CSR26',
        // Store reason in a way that can be tracked (using giftCodeUsed field as note)
        giftCodeUsed: `ADMIN_ADJUSTMENT: ${reason.trim()}`,
      },
    });

    // Check if user should be upgraded to CERTIFIED
    const thresholdSetting = await prisma.setting.findUnique({
      where: { key: 'CERTIFICATION_THRESHOLD' },
    });
    const threshold = thresholdSetting ? parseFloat(thresholdSetting.value) : 10;

    if (user.walletBalance.toNumber() >= threshold && user.status === 'ACCUMULATION') {
      await prisma.user.update({
        where: { id },
        data: { status: 'CERTIFIED' },
      });
    }

    // Return updated user
    const updatedUser = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: { select: { transactions: true } },
      },
    });

    res.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/export/csv - Export users to CSV
export const exportUsersCSV = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log('[CSV EXPORT] Starting export...');
    console.log('[CSV EXPORT] Query params:', req.query);
    console.log('[CSV EXPORT] User:', req.user?.email);
    console.log('[CSV EXPORT] Auth token present:', !!req.token);

    const { status, startDate, endDate } = req.query;

    // Build where clause
    const where: Prisma.UserWhereInput = {};

    if (status && typeof status === 'string' && (status === 'ACCUMULATION' || status === 'CERTIFIED')) {
      where.status = status as UserStatus;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        _count: {
          select: { transactions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log('[CSV EXPORT] Found users:', users.length);

    // Build CSV
    const headers = [
      'ID',
      'Email',
      'First Name',
      'Last Name',
      'Date of Birth',
      'Street',
      'City',
      'Postal Code',
      'Country',
      'State',
      'Wallet Balance (EUR)',
      'Impact (kg)',
      'Status',
      'Transaction Count',
      'Corsair Exported',
      'Created At',
    ];

    const rows = users.map((user) => [
      user.id,
      user.email,
      user.firstName || '',
      user.lastName || '',
      user.dateOfBirth ? user.dateOfBirth.toISOString().split('T')[0] : '',
      user.street || '',
      user.city || '',
      user.postalCode || '',
      user.country || '',
      user.state || '',
      user.walletBalance.toFixed(2),
      user.walletImpactKg.toFixed(2),
      user.status,
      user._count.transactions.toString(),
      user.corsairExported ? 'Yes' : 'No',
      user.createdAt.toISOString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=csr26-users-${new Date().toISOString().split('T')[0]}.csv`);
    console.log('[CSV EXPORT] Sending CSV with', csvContent.length, 'characters');
    res.send(csvContent);
  } catch (error) {
    console.error('[CSV EXPORT] Error:', error);
    next(error);
  }
};
