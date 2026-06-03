/**
 * server/src/controllers/quotationController.js
 * ─────────────────────────────────────────────────────────────────────────────
 * QUOTATION CONTROLLER — MongoDB / Mongoose version (JavaScript version)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import mongoose from 'mongoose';
import {
  Quotation,
  QuotationItem,
  Product,
  User,
} from '../config/models.js';
import {
  convertToBase,
  convertPriceFromBaseUnitPaise,
} from '../utils/unitConverter.js';

// ── Helper: format a QuotationItem with its populated product ──────────────────
function formatItem(item, product) {
  const unitPriceINR = convertPriceFromBaseUnitPaise(
    item.unitPricePaise,
    item.quantityInBaseUnits === 0 ? 'g' : product.baseUnit
  );

  return {
    id:           item._id.toString(),
    productId:    product._id.toString(),
    productName:  product.name,
    orderedQty:   item.orderedQuantity,
    orderedUnit:  item.orderedUnit,
    baseQty:      item.quantityInBaseUnits,
    baseUnit:     product.baseUnit,
    unitPriceINR: convertPriceFromBaseUnitPaise(item.unitPricePaise, product.baseUnit),
    lineTotalINR: item.lineTotalPaise / 100,
  };
}

// ── Helper: format a Quotation document for API response ──────────────────────
function formatQuotation(q, seller, items) {
  return {
    id:             q._id.toString(),
    sellerId:       q.sellerId.toString(),
    sellerName:     seller.name,
    sellerEmail:    seller.email,
    status:         q.status,
    totalAmountINR: q.totalAmountPaise / 100,
    notes:          q.notes ?? '',
    createdAt:      q.createdAt,
    updatedAt:      q.updatedAt,
    ...(items !== undefined ? { items } : {}),
  };
}

// ── Helper: load items for a quotation ────────────────────────────────────────
async function loadItems(quotationId) {
  const rawItems = await QuotationItem.find({ quotationId }).lean();

  const formatted = [];
  for (const item of rawItems) {
    const product = await Product.findById(item.productId);
    if (product) {
      formatted.push(formatItem(item, product));
    }
  }
  return formatted;
}

// ── POST /api/seller/quotations ───────────────────────────────────────────────
export async function createQuotation(req, res) {
  const session = await mongoose.startSession();

  try {
    const { items, notes } = req.body;
    const sellerId = req.user.id;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: 'At least one item is required.' });
      return;
    }

    let createdQuotationId = null;

    try {
      await session.withTransaction(async () => {
        let totalAmountPaise = 0;
        const itemDocs = [];

        for (const item of items) {
          if (!item.productId || !item.quantity || !item.selectedUnit) {
            throw new Error('Each item requires productId, quantity, and selectedUnit.');
          }

          if (!mongoose.Types.ObjectId.isValid(item.productId)) {
            throw new Error(`Invalid productId: ${item.productId}`);
          }

          const product = await Product.findById(item.productId).session(session);

          if (!product) {
            throw new Error(`Product ${item.productId} not found.`);
          }

          if (!product.isActive) {
            throw new Error(`Product "${product.name}" is no longer available.`);
          }

          const quantityInBaseUnits = convertToBase(
            Number(item.quantity),
            item.selectedUnit
          );
          const unitPricePaise = product.basePricePaise;
          const lineTotalPaise = quantityInBaseUnits * unitPricePaise;

          totalAmountPaise += lineTotalPaise;

          itemDocs.push({
            quotationId:         new mongoose.Types.ObjectId(),
            productId:           product._id,
            orderedQuantity:     Number(item.quantity),
            orderedUnit:         item.selectedUnit,
            quantityInBaseUnits,
            unitPricePaise,
            lineTotalPaise,
          });
        }

        const [quotation] = await Quotation.create(
          [{ sellerId, totalAmountPaise, notes: notes ?? '' }],
          { session }
        );

        createdQuotationId = quotation._id.toString();

        const itemsWithQuotationId = itemDocs.map((doc) => ({
          ...doc,
          quotationId: quotation._id,
        }));

        await QuotationItem.insertMany(itemsWithQuotationId, { session });
      });
    } catch (txError) {
      // Fallback: If this is a standalone MongoDB (no replica set), transactions fail.
      // We run the operations without a transaction.
      if (txError.message.includes('Transaction numbers are only allowed')) {
        console.warn('[Quotations] Standalone MongoDB detected. Executing non-transactional fallback.');
        
        let totalAmountPaise = 0;
        const itemDocs = [];

        for (const item of items) {
          if (!item.productId || !item.quantity || !item.selectedUnit) {
            throw new Error('Each item requires productId, quantity, and selectedUnit.');
          }

          if (!mongoose.Types.ObjectId.isValid(item.productId)) {
            throw new Error(`Invalid productId: ${item.productId}`);
          }

          const product = await Product.findById(item.productId);

          if (!product) {
            throw new Error(`Product ${item.productId} not found.`);
          }

          if (!product.isActive) {
            throw new Error(`Product "${product.name}" is no longer available.`);
          }

          const quantityInBaseUnits = convertToBase(
            Number(item.quantity),
            item.selectedUnit
          );
          const unitPricePaise = product.basePricePaise;
          const lineTotalPaise = quantityInBaseUnits * unitPricePaise;

          totalAmountPaise += lineTotalPaise;

          itemDocs.push({
            productId:           product._id,
            orderedQuantity:     Number(item.quantity),
            orderedUnit:         item.selectedUnit,
            quantityInBaseUnits,
            unitPricePaise,
            lineTotalPaise,
          });
        }

        const [quotation] = await Quotation.create([
          { sellerId, totalAmountPaise, notes: notes ?? '' }
        ]);

        createdQuotationId = quotation._id.toString();

        const itemsWithQuotationId = itemDocs.map((doc) => ({
          ...doc,
          quotationId: quotation._id,
        }));

        await QuotationItem.insertMany(itemsWithQuotationId);
      } else {
        throw txError;
      }
    }

    const newQuotation = await Quotation.findById(createdQuotationId);
    const seller = await User.findById(sellerId);

    if (!newQuotation || !seller) {
      res.status(500).json({ success: false, message: 'Failed to fetch created quotation.' });
      return;
    }

    res.status(201).json({
      success: true,
      data:    formatQuotation(newQuotation, seller),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error.';
    console.error('[Quotations] createQuotation error:', error);

    const status = message.includes('not found') || message.includes('requires') ? 400 : 500;
    res.status(status).json({ success: false, message });
  } finally {
    session.endSession();
  }
}

export async function getMyQuotations(req, res) {
  try {
    const sellerId = req.user.id;

    const quotations = await Quotation.find({ sellerId })
      .sort({ createdAt: -1 });

    const seller = await User.findById(sellerId);
    if (!seller) {
      res.status(404).json({ success: false, message: 'Seller not found.' });
      return;
    }

    const quotationIds = quotations.map((q) => q._id);
    const itemsCountGroup = await QuotationItem.aggregate([
      { $match: { quotationId: { $in: quotationIds } } },
      { $group: { _id: '$quotationId', count: { $sum: 1 } } }
    ]);
    const countMap = new Map(itemsCountGroup.map((g) => [g._id.toString(), g.count]));

    const formatted = quotations.map((q) => {
      const base = formatQuotation(q, seller);
      return {
        ...base,
        itemCount: countMap.get(q._id.toString()) ?? 0,
      };
    });

    res.status(200).json({
      success: true,
      data:    formatted,
      count:   quotations.length,
    });
  } catch (error) {
    console.error('[Quotations] getMyQuotations error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ── GET /api/seller/quotations/:id ────────────────────────────────────────────
export async function getMyQuotationById(req, res) {
  try {
    const { id }   = req.params;
    const sellerId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid quotation ID.' });
      return;
    }

    const quotation = await Quotation.findOne({ _id: id, sellerId });
    if (!quotation) {
      res.status(404).json({ success: false, message: 'Quotation not found.' });
      return;
    }

    const seller = await User.findById(sellerId);
    if (!seller) {
      res.status(404).json({ success: false, message: 'Seller not found.' });
      return;
    }

    const items = await loadItems(id);

    res.status(200).json({
      success: true,
      data:    formatQuotation(quotation, seller, items),
    });
  } catch (error) {
    console.error('[Quotations] getMyQuotationById error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

export async function getAllQuotations(req, res) {
  try {
    const { status } = req.query;

    const filter = {};
    if (status && ['pending', 'approved', 'rejected', 'fulfilled'].includes(status)) {
      filter['status'] = status;
    }

    const quotations = await Quotation.find(filter).sort({ createdAt: -1 });

    const sellerIds = [...new Set(quotations.map((q) => q.sellerId.toString()))];
    const sellers   = await User.find({ _id: { $in: sellerIds } });
    const sellerMap = new Map(sellers.map((s) => [s._id.toString(), s]));

    const quotationIds = quotations.map((q) => q._id);
    const itemsCountGroup = await QuotationItem.aggregate([
      { $match: { quotationId: { $in: quotationIds } } },
      { $group: { _id: '$quotationId', count: { $sum: 1 } } }
    ]);
    const countMap = new Map(itemsCountGroup.map((g) => [g._id.toString(), g.count]));

    const formatted = quotations.map((q) => {
      const seller = sellerMap.get(q.sellerId.toString());
      const base = seller
        ? formatQuotation(q, seller)
        : { ...q.toObject(), id: q._id.toString(), sellerName: 'Unknown', sellerEmail: '', totalAmountINR: q.totalAmountPaise / 100 };
      return {
        ...base,
        itemCount: countMap.get(q._id.toString()) ?? 0,
      };
    });

    res.status(200).json({
      success: true,
      data:    formatted,
      count:   quotations.length,
    });
  } catch (error) {
    console.error('[Quotations] getAllQuotations error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ── GET /api/admin/quotations/:id ─────────────────────────────────────────────
export async function getQuotationByIdAdmin(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid quotation ID.' });
      return;
    }

    const quotation = await Quotation.findById(id);
    if (!quotation) {
      res.status(404).json({ success: false, message: 'Quotation not found.' });
      return;
    }

    const seller = await User.findById(quotation.sellerId);
    if (!seller) {
      res.status(404).json({ success: false, message: 'Seller not found.' });
      return;
    }

    const items = await loadItems(id);

    res.status(200).json({
      success: true,
      data:    formatQuotation(quotation, seller, items),
    });
  } catch (error) {
    console.error('[Quotations] getQuotationByIdAdmin error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ── PUT /api/admin/quotations/:id ─────────────────────────────────────────────
export async function updateQuotationStatus(req, res) {
  try {
    const { id }     = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'approved', 'rejected', 'fulfilled'];

    if (!validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: `status must be one of: ${validStatuses.join(', ')}`,
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid quotation ID.' });
      return;
    }

    const updated = await Quotation.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true, runValidators: true }
    );

    if (!updated) {
      res.status(404).json({ success: false, message: 'Quotation not found.' });
      return;
    }

    const seller = await User.findById(updated.sellerId);
    if (!seller) {
      res.status(404).json({ success: false, message: 'Seller not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      data:    formatQuotation(updated, seller),
    });
  } catch (error) {
    console.error('[Quotations] updateQuotationStatus error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}
