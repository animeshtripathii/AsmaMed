/**
 * client/src/api/quotations.js
 * ─────────────────────────────────────────────────────────────────────────────
 * QUOTATIONS API FUNCTIONS (JavaScript version)
 * ─────────────────────────────────────────────────────────────────────────────
 */
import api from './axiosInstance';

/**
 * POST /api/seller/quotations
 * Submit the cart as a purchase quotation.
 */
export async function createQuotation(items, notes) {
  const payload = {
    items: items.map((item) => ({
      productId:    item.product.id,
      quantity:     item.quantity,
      selectedUnit: item.selectedUnit,
    })),
    notes,
  };

  const res = await api.post('/seller/quotations', payload);
  return res.data.data;
}

/**
 * GET /api/seller/quotations
 * Fetch the authenticated seller's own quotations.
 */
export async function getMyQuotations() {
  const res = await api.get('/seller/quotations');
  return res.data.data;
}

/**
 * GET /api/seller/quotations/:id
 * Fetch a single quotation (seller must own it).
 */
export async function getQuotationById(id) {
  const res = await api.get(`/seller/quotations/${id}`);
  return res.data.data;
}

/**
 * GET /api/admin/quotations
 * Fetch all quotations. Admin only. Supports optional status filter.
 */
export async function getAllQuotations(status) {
  const params = status ? { status } : undefined;
  const res = await api.get('/admin/quotations', { params });
  return res.data.data;
}

/**
 * GET /api/admin/quotations/:id
 * Fetch full quotation detail including line items. Admin only.
 */
export async function getAdminQuotationById(id) {
  const res = await api.get(`/admin/quotations/${id}`);
  return res.data.data;
}

/**
 * PUT /api/admin/quotations/:id
 * Update quotation status (approve / reject / fulfill). Admin only.
 */
export async function updateQuotationStatus(id, status) {
  const res = await api.put(`/admin/quotations/${id}`, { status });
  return res.data.data;
}
