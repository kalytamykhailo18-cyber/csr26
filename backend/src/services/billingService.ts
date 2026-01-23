// CSR26 Billing Service
// Handles monthly billing and invoice generation for merchants
// Run via cron job or admin trigger at end of each month

import { prisma } from '../lib/prisma.js';
import type { Invoice, Merchant } from '@prisma/client';

// ============================================
// TYPES
// ============================================

export interface BillingResult {
  merchantId: string;
  merchantName: string;
  invoice: Invoice | null;
  error?: string;
}

export interface MonthlyBillingResult {
  processedAt: string;
  periodStart: string;
  periodEnd: string;
  merchantsProcessed: number;
  invoicesGenerated: number;
  totalBilled: number;
  totalImpactKg: number;
  results: BillingResult[];
}

export interface InvoiceDetails extends Invoice {
  merchant: {
    id: string;
    name: string;
    email: string;
  };
  transactions: {
    id: string;
    amount: number;
    impactKg: number;
    paymentMode: string;
    createdAt: Date;
  }[];
}

// ============================================
// INVOICE GENERATION
// ============================================

// Generate invoice for a single merchant
export const generateMerchantInvoice = async (
  merchantId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<Invoice | null> => {
  // Get merchant details
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
  });

  if (!merchant) {
    console.error(`[Billing] Merchant not found: ${merchantId}`);
    return null;
  }

  if (!merchant.monthlyBilling) {
    console.log(`[Billing] Monthly billing disabled for merchant: ${merchant.name}`);
    return null;
  }

  // Get merchant's currentBalance (accumulated charges for CLAIM/ALLOCATION)
  const currentBalance = Number(merchant.currentBalance);

  // If balance is 0, skip invoice generation
  if (currentBalance <= 0) {
    console.log(`[Billing] No balance for merchant: ${merchant.name}`);
    return null;
  }

  // Get transactions for the billing period (for record keeping)
  const transactions = await prisma.transaction.findMany({
    where: {
      merchantId,
      createdAt: { gte: periodStart, lte: periodEnd },
      paymentStatus: 'COMPLETED',
      paymentMode: { in: ['CLAIM', 'ALLOCATION'] }, // Only merchant-billed modes
    },
    select: {
      id: true,
      impactKg: true,
      amount: true,
    },
  });

  const transactionCount = transactions.length;
  const totalImpactKg = transactions.reduce((sum, t) => sum + Number(t.impactKg), 0);

  // Create invoice
  const invoice = await prisma.invoice.create({
    data: {
      merchantId,
      periodStart,
      periodEnd,
      transactionCount,
      totalImpactKg,
      amount: currentBalance, // Use accumulated balance
      paid: false,
    },
  });

  // Reset merchant's currentBalance and update lastBillingDate
  await prisma.merchant.update({
    where: { id: merchantId },
    data: {
      currentBalance: 0,
      lastBillingDate: new Date(),
    },
  });

  console.log(`[Billing] Invoice generated for ${merchant.name}: €${currentBalance.toFixed(2)}`);

  return invoice;
};

// ============================================
// MONTHLY BILLING PROCESS
// ============================================

// Run monthly billing for all merchants
export const runMonthlyBilling = async (
  year?: number,
  month?: number
): Promise<MonthlyBillingResult> => {
  // Default to previous month
  const now = new Date();
  const billingYear = year ?? (now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear());
  const billingMonth = month ?? (now.getMonth() === 0 ? 11 : now.getMonth() - 1);

  // Calculate billing period
  const periodStart = new Date(billingYear, billingMonth, 1, 0, 0, 0, 0);
  const periodEnd = new Date(billingYear, billingMonth + 1, 0, 23, 59, 59, 999);

  console.log(`[Billing] Starting monthly billing for period: ${periodStart.toISOString()} - ${periodEnd.toISOString()}`);

  // Get all merchants with monthly billing enabled
  const merchants = await prisma.merchant.findMany({
    where: { monthlyBilling: true },
  });

  const results: BillingResult[] = [];
  let invoicesGenerated = 0;
  let totalBilled = 0;
  let totalImpactKg = 0;

  for (const merchant of merchants) {
    try {
      const invoice = await generateMerchantInvoice(merchant.id, periodStart, periodEnd);

      if (invoice) {
        invoicesGenerated++;
        totalBilled += Number(invoice.amount);
        totalImpactKg += Number(invoice.totalImpactKg);
      }

      results.push({
        merchantId: merchant.id,
        merchantName: merchant.name,
        invoice,
      });
    } catch (error) {
      console.error(`[Billing] Error processing merchant ${merchant.name}:`, error);
      results.push({
        merchantId: merchant.id,
        merchantName: merchant.name,
        invoice: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  console.log(`[Billing] Monthly billing completed: ${invoicesGenerated} invoices, €${totalBilled.toFixed(2)} total`);

  return {
    processedAt: new Date().toISOString(),
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    merchantsProcessed: merchants.length,
    invoicesGenerated,
    totalBilled,
    totalImpactKg,
    results,
  };
};

// ============================================
// INVOICE QUERIES
// ============================================

// Get invoice with full details
export const getInvoiceDetails = async (invoiceId: string): Promise<InvoiceDetails | null> => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      merchant: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!invoice) {
    return null;
  }

  // Get transactions for the invoice period
  const transactions = await prisma.transaction.findMany({
    where: {
      merchantId: invoice.merchantId,
      createdAt: { gte: invoice.periodStart, lte: invoice.periodEnd },
      paymentStatus: 'COMPLETED',
      paymentMode: { in: ['CLAIM', 'ALLOCATION'] },
    },
    select: {
      id: true,
      amount: true,
      impactKg: true,
      paymentMode: true,
      createdAt: true,
    },
  });

  return {
    ...invoice,
    transactions: transactions.map(t => ({
      ...t,
      amount: Number(t.amount),
      impactKg: Number(t.impactKg),
    })),
  };
};

// Get all invoices for a merchant
export const getMerchantInvoices = async (
  merchantId: string,
  limit: number = 12
): Promise<Invoice[]> => {
  return prisma.invoice.findMany({
    where: { merchantId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
};

// ============================================
// INVOICE PAYMENT
// ============================================

// Mark invoice as paid
export const markInvoicePaid = async (
  invoiceId: string,
  stripePaymentId?: string
): Promise<Invoice> => {
  return prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      paid: true,
      paidAt: new Date(),
      stripePaymentId,
    },
  });
};

// ============================================
// BILLING STATISTICS
// ============================================

// Get billing statistics
export const getBillingStats = async (): Promise<{
  totalInvoices: number;
  paidInvoices: number;
  unpaidInvoices: number;
  totalBilled: number;
  totalPaid: number;
  totalOutstanding: number;
}> => {
  const [allInvoices, paidInvoices] = await Promise.all([
    prisma.invoice.aggregate({
      _count: true,
      _sum: { amount: true },
    }),
    prisma.invoice.aggregate({
      where: { paid: true },
      _count: true,
      _sum: { amount: true },
    }),
  ]);

  const totalBilled = Number(allInvoices._sum.amount || 0);
  const totalPaid = Number(paidInvoices._sum.amount || 0);

  return {
    totalInvoices: allInvoices._count,
    paidInvoices: paidInvoices._count,
    unpaidInvoices: allInvoices._count - paidInvoices._count,
    totalBilled,
    totalPaid,
    totalOutstanding: totalBilled - totalPaid,
  };
};

// Get merchants with outstanding balances
export const getMerchantsWithBalance = async (): Promise<{
  merchant: Merchant;
  currentBalance: number;
  unpaidInvoices: number;
  totalUnpaid: number;
}[]> => {
  const merchants = await prisma.merchant.findMany({
    where: {
      OR: [
        { currentBalance: { gt: 0 } },
        { invoices: { some: { paid: false } } },
      ],
    },
    include: {
      invoices: {
        where: { paid: false },
        select: { amount: true },
      },
    },
  });

  return merchants.map(m => ({
    merchant: m,
    currentBalance: Number(m.currentBalance),
    unpaidInvoices: m.invoices.length,
    totalUnpaid: m.invoices.reduce((sum, inv) => sum + Number(inv.amount), 0),
  }));
};
