/**
 * server/src/routes/quotations.js
 * Quotation routes for seller cart submission and admin management.
 */
import { Router } from 'express';
import {
  createQuotation,
  getMyQuotations,
  getMyQuotationById,
  getAllQuotations,
  getQuotationByIdAdmin,
  updateQuotationStatus,
} from '../controllers/quotationController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// ── Seller Routes ─────────────────────────────────────────────────────────────
router.post('/seller/quotations',       authenticate, requireRole(['seller']), createQuotation);
router.get( '/seller/quotations',       authenticate, requireRole(['seller']), getMyQuotations);
router.get( '/seller/quotations/:id',   authenticate, requireRole(['seller']), getMyQuotationById);

// ── Admin Routes ──────────────────────────────────────────────────────────────
router.get( '/admin/quotations',        authenticate, requireRole(['admin']), getAllQuotations);
router.get( '/admin/quotations/:id',    authenticate, requireRole(['admin']), getQuotationByIdAdmin);
router.put( '/admin/quotations/:id',    authenticate, requireRole(['admin']), updateQuotationStatus);

export default router;
