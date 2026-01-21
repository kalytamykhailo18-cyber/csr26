import { Router } from 'express';
import * as paymentController from '../controllers/paymentController.js';
import { optionalAuth, authenticate } from '../middleware/auth.js';
import express from 'express';

const router = Router();

// POST /api/payments/create-intent - Create Stripe payment intent
router.post('/create-intent', optionalAuth, paymentController.createPaymentIntent);

// POST /api/payments/resume/:transactionId - Resume payment for pending transaction
router.post('/resume/:transactionId', authenticate, paymentController.resumePayment);

// POST /api/payments/webhook - Stripe webhook handler
// Note: This needs raw body, not JSON parsed
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  paymentController.handleWebhook
);

export default router;
