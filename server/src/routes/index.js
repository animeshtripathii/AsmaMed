/**
 * server/src/routes/index.js
 * ─────────────────────────────────────────────────────────────────────────────
 * ROUTE AGGREGATOR (JavaScript version)
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { Router } from 'express';
import authRoutes       from './auth.js';
import productRoutes    from './products.js';
import quotationRoutes  from './quotations.js';
import productRequestRoutes from './productRequests.js';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'AasaMedChem API is running.',
    timestamp: new Date().toISOString(),
  });
});

// ── Mount Route Modules ───────────────────────────────────────────────────────
router.use('/auth', authRoutes);
router.use('/products/requests', productRequestRoutes);
router.use('/', productRoutes);
router.use('/', quotationRoutes);

export default router;
