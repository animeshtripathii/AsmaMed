/**
 * server/src/routes/products.js
 * Product routes for both public/seller read and admin CRUD.
 */
import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// ── Public / Seller Routes ────────────────────────────────────────────────────
router.get('/products',    authenticate, getProducts);
router.get('/products/:id', authenticate, getProductById);

// ── Admin-Only Routes ─────────────────────────────────────────────────────────
router.post(  '/admin/products',     authenticate, requireRole(['admin']), createProduct);
router.put(   '/admin/products/:id', authenticate, requireRole(['admin']), updateProduct);
router.delete('/admin/products/:id', authenticate, requireRole(['admin']), deleteProduct);

export default router;
