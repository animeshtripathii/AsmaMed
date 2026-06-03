/**
 * server/src/routes/productRequests.js
 * ─────────────────────────────────────────────────────────────────────────────
 * PRODUCT REQUESTS ROUTES (JavaScript version)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Router } from 'express';
import {
  createRequest,
  getRequests,
  updateRequestStatus,
} from '../controllers/productRequestController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// Apply authenticate middleware to all routes in this router
router.use(authenticate);

// POST /api/products/requests — Create a request (Sellers and Admins)
router.post('/', createRequest);

// GET /api/products/requests — List requests (Admins get all, Sellers get their own)
router.get('/', getRequests);

// PUT /api/products/requests/:id/status — Approve/reject a request (Admin only)
router.put('/:id/status', requireRole(['admin']), updateRequestStatus);

export default router;
