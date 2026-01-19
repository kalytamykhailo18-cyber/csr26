import { Router } from 'express';
import * as skuController from '../controllers/skuController.js';
import { authenticate, adminOnly } from '../middleware/auth.js';

const router = Router();

// GET /api/skus/:code - Get SKU by code (public - for landing page)
router.get('/:code', skuController.getSkuByCode);

// GET /api/skus - List all SKUs (admin only)
router.get('/', authenticate, adminOnly, skuController.getAllSkus);

// POST /api/skus - Create new SKU (admin only)
router.post('/', authenticate, adminOnly, skuController.createSku);

// PUT /api/skus/:code - Update SKU (admin only)
router.put('/:code', authenticate, adminOnly, skuController.updateSku);

// DELETE /api/skus/:code - Delete SKU (admin only)
router.delete('/:code', authenticate, adminOnly, skuController.deleteSku);

export default router;
