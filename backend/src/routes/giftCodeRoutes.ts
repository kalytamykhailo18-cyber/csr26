import { Router } from 'express';
import * as giftCodeController from '../controllers/giftCodeController.js';
import { authenticate, adminOnly } from '../middleware/auth.js';

const router = Router();

// POST /api/gift-codes/validate - Validate a gift code (public - for landing page)
router.post('/validate', giftCodeController.validateGiftCode);

// GET /api/gift-codes - List all gift codes (admin only)
router.get('/', authenticate, adminOnly, giftCodeController.getAllGiftCodes);

// POST /api/gift-codes/batch - Upload batch of gift codes (admin only)
router.post('/batch', authenticate, adminOnly, giftCodeController.batchUpload);

// PATCH /api/gift-codes/:code/activate - Activate a deactivated gift code (admin only)
// IMPORTANT: This must come BEFORE /:code route to match correctly
router.patch('/:code/activate', authenticate, adminOnly, giftCodeController.activateGiftCode);

// DELETE /api/gift-codes/:code - Deactivate a gift code (admin only)
router.delete('/:code', authenticate, adminOnly, giftCodeController.deactivateGiftCode);

export default router;
