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
  await prisma.transaction.create({
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

  const response: ApiResponse<PaymentIntentResponse> = {
    success: true,
    data: {
      clientSecret: paymentIntent.client_secret!,
      paymentIntentId: paymentIntent.id,
    },
  };

  res.json(response);
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
