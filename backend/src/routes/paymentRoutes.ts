import { Router } from 'express';
import * as paymentController from '../controllers/paymentController.js';
import { optionalAuth, authenticate } from '../middleware/auth.js';

const router = Router();

// POST /api/payments/create-intent - Create Stripe payment intent
router.post('/create-intent', optionalAuth, paymentController.createPaymentIntent);

// POST /api/payments/resume/:transactionId - Resume payment for pending transaction
router.post('/resume/:transactionId', authenticate, paymentController.resumePayment);

// POST /api/payments/confirm/:transactionId - Confirm payment and sync data after Stripe success
router.post('/confirm/:transactionId', authenticate, paymentController.confirmPayment);

// NOTE: Webhook route is registered in app.ts BEFORE json middleware
// to ensure Stripe signature verification works with raw body

export default router;
