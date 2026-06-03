/**
 * client/src/api/products.js
 * ─────────────────────────────────────────────────────────────────────────────
 * PRODUCTS API FUNCTIONS (JavaScript version)
 * ─────────────────────────────────────────────────────────────────────────────
 */
import api from './axiosInstance';

/**
 * GET /api/products
 * Fetch all active products. Supports optional search, category, and unit_type filters.
 */
export async function getProducts(params) {
  const res = await api.get('/products', { params });
  return res.data.data;
}

/**
 * GET /api/products/:id
 * Fetch a single product by ID.
 */
export async function getProductById(id) {
  const res = await api.get(`/products/${id}`);
  return res.data.data;
}

/**
 * POST /api/admin/products
 * Create a new product. Admin only.
 */
export async function createProduct(data) {
  const res = await api.post('/admin/products', data);
  return res.data.data;
}

/**
 * PUT /api/admin/products/:id
 * Update an existing product. Admin only.
 */
export async function updateProduct(id, data) {
  const res = await api.put(`/admin/products/${id}`, data);
  return res.data.data;
}

/**
 * DELETE /api/admin/products/:id
 * Soft-delete a product. Admin only.
 */
export async function deleteProduct(id) {
  await api.delete(`/admin/products/${id}`);
}

/**
 * POST /api/products/requests
 * Submit a custom chemical request.
 */
export async function createProductRequest(data) {
  const res = await api.post('/products/requests', data);
  return res.data.data;
}

/**
 * GET /api/products/requests
 * Fetch list of custom chemical requests.
 */
export async function getProductRequests() {
  const res = await api.get('/products/requests');
  return res.data.data;
}

/**
 * PUT /api/products/requests/:id/status
 * Update status of a product request. Admin only.
 */
export async function updateProductRequestStatus(id, status) {
  const res = await api.put(`/products/requests/${id}/status`, { status });
  return res.data.data;
}
