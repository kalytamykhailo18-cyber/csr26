// CSR26 Corsair Connect Export Service
// Handles exporting certified user data to Corsair Connect system
// Triggers: Individual on €10 threshold, Monthly batch for all certified

import { prisma } from '../lib/prisma.js';
import { getCertificationThreshold } from './calculationService.js';

// ============================================
// TYPES
// ============================================

export interface CorsairExportRecord {
  corsairId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  dateOfBirth: string | null;
  street: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  state: string | null;
  totalImpactKg: number;
  maturedImpactKg: number;
  pendingImpactKg: number;
  walletBalance: number;
  certificationDate: string;
  transactionCount: number;
  firstTransactionDate: string | null;
  lastTransactionDate: string | null;
  attributionIds: {
    merchantIds: string[];
    partnerIds: string[];
  };
}

export interface CorsairBatchExportResult {
  exportDate: string;
  recordCount: number;
  records: CorsairExportRecord[];
  format: 'csv' | 'json';
}

// ============================================
// HELPER FUNCTIONS
// ============================================

// Generate a unique Corsair ID for a user
const generateCorsairId = (userId: string): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `CSR26-${timestamp}-${random}`.toUpperCase();
};

// Format date to ISO string or null
const formatDate = (date: Date | null | undefined): string | null => {
  if (!date) return null;
  const isoString = date.toISOString();
  return isoString.split('T')[0] ?? null;
};

// Get current date as string
const getCurrentDateString = (): string => {
  return new Date().toISOString().split('T')[0] ?? new Date().toISOString().slice(0, 10);
};

// Convert records to CSV format
export const convertToCSV = (records: CorsairExportRecord[]): string => {
  if (records.length === 0) return '';

  const headers = [
    'Corsair ID',
    'Email',
    'First Name',
    'Last Name',
    'Date of Birth',
    'Street',
    'City',
    'Postal Code',
    'Country',
    'State',
    'Total Impact (kg)',
    'Matured Impact (kg)',
    'Pending Impact (kg)',
    'Wallet Balance (EUR)',
    'Certification Date',
    'Transaction Count',
    'First Transaction Date',
    'Last Transaction Date',
    'Merchant IDs',
    'Partner IDs',
  ];

  const rows = records.map(record => [
    record.corsairId,
    record.email,
    record.firstName || '',
    record.lastName || '',
    record.dateOfBirth || '',
    record.street || '',
    record.city || '',
    record.postalCode || '',
    record.country || '',
    record.state || '',
    record.totalImpactKg.toFixed(4),
    record.maturedImpactKg.toFixed(4),
    record.pendingImpactKg.toFixed(4),
    record.walletBalance.toFixed(2),
    record.certificationDate,
    record.transactionCount.toString(),
    record.firstTransactionDate || '',
    record.lastTransactionDate || '',
    record.attributionIds.merchantIds.join(';'),
    record.attributionIds.partnerIds.join(';'),
  ]);

  // Escape CSV values
  const escapeCSV = (value: string): string => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(escapeCSV).join(',')),
  ].join('\n');

  return csvContent;
};

// ============================================
// INDIVIDUAL EXPORT (On Threshold)
// ============================================

// Export a single user when they reach certification threshold
// Called from calculationService.checkThresholdUpgrade
export const exportUserToCorsair = async (userId: string): Promise<CorsairExportRecord | null> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      transactions: {
        where: { paymentStatus: 'COMPLETED' },
        orderBy: { createdAt: 'asc' },
        select: {
          createdAt: true,
          merchantId: true,
          partnerId: true,
        },
      },
    },
  });

  if (!user) {
    console.error(`[Corsair Export] User not found: ${userId}`);
    return null;
  }

  // Check if user is certified
  if (user.status !== 'CERTIFIED') {
    console.log(`[Corsair Export] User not certified, skipping: ${userId}`);
    return null;
  }

  // Check if already exported
  if (user.corsairExported && user.corsairId) {
    console.log(`[Corsair Export] User already exported: ${userId}, Corsair ID: ${user.corsairId}`);
    return null;
  }

  // Generate Corsair ID
  const corsairId = generateCorsairId(userId);

  // Collect unique merchant and partner IDs
  const merchantIds = [...new Set(user.transactions.map(t => t.merchantId).filter(Boolean))] as string[];
  const partnerIds = [...new Set(user.transactions.map(t => t.partnerId).filter(Boolean))] as string[];

  // Get first and last transaction dates
  const firstTransaction = user.transactions[0];
  const lastTransaction = user.transactions[user.transactions.length - 1];

  // Create export record
  const record: CorsairExportRecord = {
    corsairId,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    dateOfBirth: formatDate(user.dateOfBirth),
    street: user.street,
    city: user.city,
    postalCode: user.postalCode,
    country: user.country,
    state: user.state,
    totalImpactKg: Number(user.walletImpactKg),
    maturedImpactKg: Number(user.maturedImpactKg),
    pendingImpactKg: Number(user.pendingImpactKg),
    walletBalance: Number(user.walletBalance),
    certificationDate: getCurrentDateString(),
    transactionCount: user.transactions.length,
    firstTransactionDate: firstTransaction ? formatDate(firstTransaction.createdAt) : null,
    lastTransactionDate: lastTransaction ? formatDate(lastTransaction.createdAt) : null,
    attributionIds: {
      merchantIds,
      partnerIds,
    },
  };

  // Update user with Corsair ID and mark as exported
  await prisma.user.update({
    where: { id: userId },
    data: {
      corsairId,
      corsairExported: true,
    },
  });

  console.log(`[Corsair Export] User exported successfully: ${userId}, Corsair ID: ${corsairId}`);
  return record;
};

// ============================================
// BATCH EXPORT (Monthly)
// ============================================

// Export all certified users who haven't been exported yet
export const exportPendingCertifiedUsers = async (): Promise<CorsairBatchExportResult> => {
  const users = await prisma.user.findMany({
    where: {
      status: 'CERTIFIED',
      corsairExported: false,
    },
    include: {
      transactions: {
        where: { paymentStatus: 'COMPLETED' },
        orderBy: { createdAt: 'asc' },
        select: {
          createdAt: true,
          merchantId: true,
          partnerId: true,
        },
      },
    },
  });

  const records: CorsairExportRecord[] = [];

  for (const user of users) {
    const corsairId = generateCorsairId(user.id);

    const merchantIds = [...new Set(user.transactions.map(t => t.merchantId).filter(Boolean))] as string[];
    const partnerIds = [...new Set(user.transactions.map(t => t.partnerId).filter(Boolean))] as string[];

    const firstTransaction = user.transactions[0];
    const lastTransaction = user.transactions[user.transactions.length - 1];

    const record: CorsairExportRecord = {
      corsairId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      dateOfBirth: formatDate(user.dateOfBirth),
      street: user.street,
      city: user.city,
      postalCode: user.postalCode,
      country: user.country,
      state: user.state,
      totalImpactKg: Number(user.walletImpactKg),
      maturedImpactKg: Number(user.maturedImpactKg),
      pendingImpactKg: Number(user.pendingImpactKg),
      walletBalance: Number(user.walletBalance),
      certificationDate: getCurrentDateString(),
      transactionCount: user.transactions.length,
      firstTransactionDate: firstTransaction ? formatDate(firstTransaction.createdAt) : null,
      lastTransactionDate: lastTransaction ? formatDate(lastTransaction.createdAt) : null,
      attributionIds: {
        merchantIds,
        partnerIds,
      },
    };

    records.push(record);

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        corsairId,
        corsairExported: true,
      },
    });
  }

  console.log(`[Corsair Export] Batch export completed: ${records.length} users`);

  return {
    exportDate: new Date().toISOString(),
    recordCount: records.length,
    records,
    format: 'json',
  };
};

// Export all certified users (including already exported) for full report
export const exportAllCertifiedUsers = async (): Promise<CorsairBatchExportResult> => {
  const users = await prisma.user.findMany({
    where: {
      status: 'CERTIFIED',
    },
    include: {
      transactions: {
        where: { paymentStatus: 'COMPLETED' },
        orderBy: { createdAt: 'asc' },
        select: {
          createdAt: true,
          merchantId: true,
          partnerId: true,
        },
      },
    },
  });

  const records: CorsairExportRecord[] = [];

  for (const user of users) {
    // Use existing Corsair ID if available, otherwise generate new one
    const corsairId = user.corsairId || generateCorsairId(user.id);

    const merchantIds = [...new Set(user.transactions.map(t => t.merchantId).filter(Boolean))] as string[];
    const partnerIds = [...new Set(user.transactions.map(t => t.partnerId).filter(Boolean))] as string[];

    const firstTransaction = user.transactions[0];
    const lastTransaction = user.transactions[user.transactions.length - 1];

    const record: CorsairExportRecord = {
      corsairId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      dateOfBirth: formatDate(user.dateOfBirth),
      street: user.street,
      city: user.city,
      postalCode: user.postalCode,
      country: user.country,
      state: user.state,
      totalImpactKg: Number(user.walletImpactKg),
      maturedImpactKg: Number(user.maturedImpactKg),
      pendingImpactKg: Number(user.pendingImpactKg),
      walletBalance: Number(user.walletBalance),
      certificationDate: formatDate(user.updatedAt) ?? getCurrentDateString(), // Use last update as certification date
      transactionCount: user.transactions.length,
      firstTransactionDate: firstTransaction ? formatDate(firstTransaction.createdAt) : null,
      lastTransactionDate: lastTransaction ? formatDate(lastTransaction.createdAt) : null,
      attributionIds: {
        merchantIds,
        partnerIds,
      },
    };

    records.push(record);

    // Update user if not already exported
    if (!user.corsairExported) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          corsairId,
          corsairExported: true,
        },
      });
    }
  }

  console.log(`[Corsair Export] Full export completed: ${records.length} certified users`);

  return {
    exportDate: new Date().toISOString(),
    recordCount: records.length,
    records,
    format: 'json',
  };
};

// ============================================
// STATISTICS
// ============================================

// Get Corsair export statistics
export const getCorsairExportStats = async (): Promise<{
  totalCertified: number;
  totalExported: number;
  pendingExport: number;
  threshold: number;
}> => {
  const threshold = await getCertificationThreshold();

  const [totalCertified, totalExported] = await Promise.all([
    prisma.user.count({ where: { status: 'CERTIFIED' } }),
    prisma.user.count({ where: { status: 'CERTIFIED', corsairExported: true } }),
  ]);

  return {
    totalCertified,
    totalExported,
    pendingExport: totalCertified - totalExported,
    threshold,
  };
};
