/**
 * server/src/controllers/productController.js
 * ─────────────────────────────────────────────────────────────────────────────
 * PRODUCT CONTROLLER — MongoDB / Mongoose version (JavaScript version)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Product } from '../config/models.js';
import {
  convertToBase,
  convertPriceToBaseUnitPaise,
  convertPriceFromBaseUnitPaise,
  getSmartDisplayUnit,
  getAvailableUnits,
  BASE_UNIT_FOR_TYPE,
} from '../utils/unitConverter.js';
import mongoose from 'mongoose';

// ── Helper: format a Product document into the API response shape ─────────────
function formatProduct(doc) {
  const basePricePaise = doc.basePricePaise;
  const stockInBase    = doc.stockInBaseUnits;
  const unitType       = doc.unitType;

  const smartStock       = getSmartDisplayUnit(stockInBase, unitType);
  const displayPriceINR  = convertPriceFromBaseUnitPaise(basePricePaise, smartStock.unit);
  
  // Format price supporting up to 6 decimal places for high precision
  const hasSubCent = (displayPriceINR * 100) % 1 !== 0;
  const priceDecimals = hasSubCent ? 6 : 2;
  const formattedPrice   = `₹${displayPriceINR.toFixed(priceDecimals)}/${smartStock.unit}`;

  return {
    id:          doc._id.toString(),
    name:        doc.name,
    description: doc.description ?? '',
    sku:         doc.sku ?? '',
    category:    doc.category ?? '',
    unitType:    unitType,
    baseUnit:    doc.baseUnit,
    isActive:    doc.isActive,
    createdAt:   doc.createdAt,
    updatedAt:   doc.updatedAt,

    displayPrice: {
      value:     displayPriceINR,
      unit:      smartStock.unit,
      formatted: formattedPrice,
    },
    basePrice: {
      paise: basePricePaise,
    },
    displayStock: {
      value: smartStock.value,
      unit:  smartStock.unit,
    },
    availableUnits: getAvailableUnits(unitType),
  };
}

// ── GET /api/products ──────────────────────────────────────────────────────────
export async function getProducts(req, res) {
  try {
    const { search, category, unit_type } = req.query;

    const filter = { isActive: true };

    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      filter['$or'] = [
        { name:     searchRegex },
        { sku:      searchRegex },
        { category: searchRegex },
      ];
    }

    if (category) {
      filter['category'] = { $regex: `^${category}$`, $options: 'i' };
    }

    if (unit_type && ['weight', 'volume', 'count'].includes(unit_type)) {
      filter['unitType'] = unit_type;
    }

    const products = await Product.find(filter).sort({ name: 1 });

    res.status(200).json({
      success: true,
      data:    products.map(formatProduct),
      count:   products.length,
    });
  } catch (error) {
    console.error('[Products] getProducts error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ── GET /api/products/:id ─────────────────────────────────────────────────────
export async function getProductById(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid product ID.' });
      return;
    }

    const product = await Product.findById(id);

    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found.' });
      return;
    }

    res.status(200).json({ success: true, data: formatProduct(product) });
  } catch (error) {
    console.error('[Products] getProductById error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ── POST /api/admin/products ──────────────────────────────────────────────────
export async function createProduct(req, res) {
  try {
    const {
      name,
      description,
      sku,
      category,
      unitType,
      priceINR,
      priceUnit,
      stockQty,
      stockUnit,
    } = req.body;

    if (!name || !unitType || priceINR === undefined || stockQty === undefined) {
      res.status(400).json({
        success: false,
        message: 'name, unitType, priceINR, and stockQty are required.',
      });
      return;
    }

    if (!['weight', 'volume', 'count'].includes(unitType)) {
      res.status(400).json({ success: false, message: 'unitType must be weight, volume, or count.' });
      return;
    }

    const basePricePaise  = convertPriceToBaseUnitPaise(Number(priceINR), priceUnit);
    const stockInBaseUnits = convertToBase(Number(stockQty), stockUnit);
    const baseUnit        = BASE_UNIT_FOR_TYPE[unitType];

    const product = await new Product({
      name,
      description: description ?? '',
      sku:         sku ?? undefined,
      category:    category ?? '',
      unitType,
      baseUnit,
      basePricePaise,
      stockInBaseUnits,
    }).save();

    res.status(201).json({ success: true, data: formatProduct(product) });
  } catch (error) {
    if (
      typeof error === 'object' && error !== null &&
      'code' in error && error.code === 11000
    ) {
      res.status(409).json({ success: false, message: 'A product with this SKU already exists.' });
      return;
    }
    console.error('[Products] createProduct error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ── PUT /api/admin/products/:id ───────────────────────────────────────────────
export async function updateProduct(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid product ID.' });
      return;
    }

    const current = await Product.findById(id);
    if (!current) {
      res.status(404).json({ success: false, message: 'Product not found.' });
      return;
    }

    const {
      name,
      description,
      sku,
      category,
      priceINR,
      priceUnit,
      stockQty,
      stockUnit,
      isActive,
    } = req.body;

    const newBasePricePaise =
      priceINR !== undefined && priceUnit !== undefined
        ? convertPriceToBaseUnitPaise(Number(priceINR), priceUnit)
        : current.basePricePaise;

    const newStockInBaseUnits =
      stockQty !== undefined && stockUnit !== undefined
        ? convertToBase(Number(stockQty), stockUnit)
        : current.stockInBaseUnits;

    const updates = {
      basePricePaise:   newBasePricePaise,
      stockInBaseUnits: newStockInBaseUnits,
    };
    if (name        !== undefined) updates['name']        = name;
    if (description !== undefined) updates['description'] = description;
    if (sku         !== undefined) updates['sku']         = sku;
    if (category    !== undefined) updates['category']    = category;
    if (isActive    !== undefined) updates['isActive']    = isActive;

    const updated = await Product.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: formatProduct(updated) });
  } catch (error) {
    console.error('[Products] updateProduct error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ── DELETE /api/admin/products/:id ────────────────────────────────────────────
export async function deleteProduct(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid product ID.' });
      return;
    }

    const updated = await Product.findByIdAndUpdate(
      id,
      { $set: { isActive: false } },
      { new: true }
    );

    if (!updated) {
      res.status(404).json({ success: false, message: 'Product not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Product "${updated.name}" has been deactivated.`,
    });
  } catch (error) {
    console.error('[Products] deleteProduct error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}
