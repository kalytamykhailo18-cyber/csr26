import { Router } from 'express';
import authRoutes from './authRoutes.js';
import skuRoutes from './skuRoutes.js';
import transactionRoutes from './transactionRoutes.js';
import walletRoutes from './walletRoutes.js';
import settingsRoutes from './settingsRoutes.js';
import giftCodeRoutes from './giftCodeRoutes.js';
import merchantRoutes from './merchantRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import userRoutes from './userRoutes.js';

const router = Router();

// Mount all route modules
router.use('/auth', authRoutes);
router.use('/skus', skuRoutes);
router.use('/transactions', transactionRoutes);
router.use('/wallet', walletRoutes);
router.use('/settings', settingsRoutes);
router.use('/gift-codes', giftCodeRoutes);
router.use('/merchants', merchantRoutes);
router.use('/payments', paymentRoutes);
router.use('/users', userRoutes);

export default router;
