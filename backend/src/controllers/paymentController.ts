import { Request, Response, NextFunction } from 'express';
import { asyncHandler, badRequest, internalError } from '../middleware/errorHandler.js';
import { prisma } from '../lib/prisma.js';
import {
  calculateImpact,
  updateUserWallet,
  calculateMaturationBreakdown,
} from '../services/calculationService.js';
import Stripe from 'stripe';
import type { ApiResponse, CreatePaymentIntentRequest, PaymentIntentResponse } from '../types/index.js';

// Initialize Stripe - from .env, NEVER hardcoded
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

let stripe: Stripe | null = null;
if (stripeSecretKey) {
  stripe = new Stripe(stripeSecretKey);
}

// POST /api/payments/create-intent - Create Stripe payment intent
export const createPaymentIntent = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  if (!stripe) {
    throw internalError('Stripe not configured');
  }

  const { amount, skuCode, email }: CreatePaymentIntentRequest = req.body;

  if (!amount || amount < 1) {
    throw badRequest('Amount must be at least €1');
  }

  if (!email) {
    throw badRequest('Email is required');
  }

  // Calculate impact for metadata
  const impact = await calculateImpact(amount);

  // Get or create user
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({ data: { email } });
  }

  // Create payment intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Stripe expects cents
    currency: 'eur',
    metadata: {
      userId: user.id,
      skuCode: skuCode || '',
      impactKg: impact.impactKg.toString(),
      impactDisplay: impact.displayValue,
    },
    receipt_email: email,
  });

  // Calculate maturation breakdown
  const maturation = calculateMaturationBreakdown(impact.impactKg);

  // Create pending transaction with maturation data
  const transaction = await prisma.transaction.create({
    data: {
      userId: user.id,
      skuCode,
      amount,
      impactKg: impact.impactKg,
      paymentMode: 'PAY',
      paymentStatus: 'PENDING',
      stripePaymentId: paymentIntent.id,
      // Maturation tracking (5/45/50 Rule)
      immediateImpactKg: maturation.immediateKg,
      midTermImpactKg: maturation.midTermKg,
      finalImpactKg: maturation.finalKg,
      midTermMaturesAt: maturation.midTermMaturesAt,
      finalMaturesAt: maturation.finalMaturesAt,
    },
  });

  const response: ApiResponse<PaymentIntentResponse & { transactionId: string }> = {
    success: true,
    data: {
      clientSecret: paymentIntent.client_secret!,
      paymentIntentId: paymentIntent.id,
      transactionId: transaction.id,
    },
  };

  res.json(response);
});

// POST /api/payments/resume/:transactionId - Resume payment for pending transaction
export const resumePayment = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  if (!stripe) {
    throw internalError('Stripe not configured');
  }

  const { transactionId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    throw badRequest('Authentication required');
  }

  // Find the pending transaction with user
  const transaction = await prisma.transaction.findFirst({
    where: {
      id: String(transactionId),
      userId: String(userId),
      paymentStatus: 'PENDING',
    },
  });

  if (!transaction) {
    throw badRequest('Pending transaction not found');
  }

  // Get user email for the receipt
  const transactionUser = await prisma.user.findUnique({
    where: { id: transaction.userId },
  });

  if (!transactionUser) {
    throw badRequest('User not found');
  }

  // Check if existing payment intent is still valid
  let clientSecret: string | null = null;
  let paymentIntentId = transaction.stripePaymentId;

  if (transaction.stripePaymentId) {
    try {
      const existingIntent = await stripe.paymentIntents.retrieve(transaction.stripePaymentId);

      // If intent is still usable (not expired, not succeeded, not cancelled)
      if (
        existingIntent.status === 'requires_payment_method' ||
        existingIntent.status === 'requires_confirmation' ||
        existingIntent.status === 'requires_action'
      ) {
        clientSecret = existingIntent.client_secret;
      }
    } catch (err) {
      // Intent not found or expired, will create new one
      console.log('Existing payment intent not usable, creating new one');
    }
  }

  // If no valid intent, create a new one
  if (!clientSecret) {
    const newIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(transaction.amount) * 100),
      currency: 'eur',
      metadata: {
        userId: transaction.userId,
        transactionId: transaction.id,
        skuCode: transaction.skuCode || '',
        impactKg: transaction.impactKg.toString(),
      },
      receipt_email: transactionUser.email,
    });

    paymentIntentId = newIntent.id;

    // Update transaction with new payment intent ID
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { stripePaymentId: newIntent.id },
    });

    clientSecret = newIntent.client_secret;
  }

  const response: ApiResponse<PaymentIntentResponse> = {
    success: true,
    data: {
      clientSecret: clientSecret!,
      paymentIntentId: paymentIntentId!,
    },
  };

  res.json(response);
});

// POST /api/payments/confirm/:transactionId - Confirm payment and sync data
// Called by frontend after Stripe confirms payment to ensure data is synced
export const confirmPayment = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  if (!stripe) {
    throw internalError('Stripe not configured');
  }

  const { transactionId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    throw badRequest('Authentication required');
  }

  // Find the transaction
  const transaction = await prisma.transaction.findFirst({
    where: {
      id: String(transactionId),
      userId: String(userId),
    },
  });

  if (!transaction) {
    throw badRequest('Transaction not found');
  }

  // If already completed, just return success
  if (transaction.paymentStatus === 'COMPLETED') {
    res.json({
      success: true,
      data: { status: 'COMPLETED', message: 'Payment already confirmed' },
    });
    return;
  }

  // Check payment intent status with Stripe
  if (!transaction.stripePaymentId) {
    throw badRequest('No payment intent associated with this transaction');
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(transaction.stripePaymentId);

  if (paymentIntent.status === 'succeeded') {
    // Update transaction status
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { paymentStatus: 'COMPLETED' },
    });

    // Update user wallet with maturation tracking
    await updateUserWallet(
      transaction.userId,
      Number(transaction.amount),
      Number(transaction.impactKg)
    );

    console.log(`[PAYMENT] Confirmed payment for transaction ${transaction.id}`);

    res.json({
      success: true,
      data: { status: 'COMPLETED', message: 'Payment confirmed successfully' },
    });
  } else if (paymentIntent.status === 'processing') {
    res.json({
      success: true,
      data: { status: 'PROCESSING', message: 'Payment is still processing' },
    });
  } else if (paymentIntent.status === 'requires_action' || paymentIntent.status === 'requires_confirmation') {
    res.json({
      success: true,
      data: { status: 'PENDING', message: 'Payment requires additional action' },
    });
  } else {
    // Payment failed or cancelled
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { paymentStatus: 'FAILED' },
    });

    res.json({
      success: true,
      data: { status: 'FAILED', message: 'Payment was not successful' },
    });
  }
});

// POST /api/payments/webhook - Stripe webhook handler
export const handleWebhook = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  if (!stripe || !stripeWebhookSecret) {
    console.error('Stripe webhook not configured');
    res.status(500).send('Webhook not configured');
    return;
  }

  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, stripeWebhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    res.status(400).send('Webhook Error');
    return;
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log('Payment succeeded:', paymentIntent.id);

      // Update transaction
      const transaction = await prisma.transaction.findFirst({
        where: { stripePaymentId: paymentIntent.id },
      });

      if (transaction) {
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: { paymentStatus: 'COMPLETED' },
        });

        // Update user wallet
        await updateUserWallet(
          transaction.userId,
          Number(transaction.amount),
          Number(transaction.impactKg)
        );
      }
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log('Payment failed:', paymentIntent.id);

      // Update transaction
      await prisma.transaction.updateMany({
        where: { stripePaymentId: paymentIntent.id },
        data: { paymentStatus: 'FAILED' },
      });
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
};
