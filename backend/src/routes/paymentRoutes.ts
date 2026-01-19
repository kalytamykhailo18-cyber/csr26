import { Router } from 'express';
import * as paymentController from '../controllers/paymentController.js';
import { optionalAuth } from '../middleware/auth.js';
import express from 'express';

const router = Router();

// POST /api/payments/create-intent - Create Stripe payment intent
router.post('/create-intent', optionalAuth, paymentController.createPaymentIntent);

// POST /api/payments/webhook - Stripe webhook handler
// Note: This needs raw body, not JSON parsed
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  paymentController.handleWebhook
);

export default router;
