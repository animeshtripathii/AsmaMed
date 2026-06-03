/**
 * server/src/controllers/productRequestController.js
 * ─────────────────────────────────────────────────────────────────────────────
 * PRODUCT REQUESTS CONTROLLER — Express Route Handlers (JavaScript version)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { ProductRequest } from '../config/models.js';

/**
 * POST /api/products/requests
 * Creates a new custom product request for the authenticated seller.
 */
export async function createRequest(req, res) {
  try {
    const { name, category, unitType, quantity, unit, description } = req.body;
    const sellerId = req.user.id;
    const sellerName = req.user.name || 'Unknown Seller';
    const sellerEmail = req.user.email;

    if (!name || !category || !unitType || !quantity || !unit) {
      res.status(400).json({
        success: false,
        message: 'Name, category, unitType, quantity, and unit are required fields.',
      });
      return;
    }

    if (Number(quantity) <= 0) {
      res.status(400).json({
        success: false,
        message: 'Quantity must be greater than zero.',
      });
      return;
    }

    const request = new ProductRequest({
      sellerId,
      sellerName,
      sellerEmail,
      name: name.trim(),
      category,
      unitType,
      quantity: Number(quantity),
      unit,
      description: description ? description.trim() : '',
      status: 'pending',
    });

    await request.save();

    res.status(201).json({
      success: true,
      message: 'Product request submitted successfully.',
      data: request,
    });
  } catch (error) {
    console.error('[ProductRequestController] createRequest error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while creating product request.',
    });
  }
}

/**
 * GET /api/products/requests
 * Retrieves product requests. Admins get all, sellers get only their own.
 */
export async function getRequests(req, res) {
  try {
    const { role, id: userId } = req.user;
    let query = {};

    if (role !== 'admin') {
      query.sellerId = userId;
    }

    const requests = await ProductRequest.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error('[ProductRequestController] getRequests error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching product requests.',
    });
  }
}

/**
 * PUT /api/products/requests/:id/status
 * Updates the status of a custom product request. (Admin only)
 */
export async function updateRequestStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      res.status(400).json({
        success: false,
        message: 'Invalid status value. Must be pending, approved, or rejected.',
      });
      return;
    }

    const request = await ProductRequest.findById(id);

    if (!request) {
      res.status(404).json({
        success: false,
        message: 'Product request not found.',
      });
      return;
    }

    request.status = status;
    await request.save();

    res.status(200).json({
      success: true,
      message: `Product request status updated to ${status}.`,
      data: request,
    });
  } catch (error) {
    console.error('[ProductRequestController] updateRequestStatus error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating request status.',
    });
  }
}
