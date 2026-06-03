/**
 * server/src/config/models.js
 * ─────────────────────────────────────────────────────────────────────────────
 * MONGOOSE SCHEMAS & MODELS — AasaMedChem (JavaScript Version)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import mongoose, { Schema } from 'mongoose';

// ── USER ──────────────────────────────────────────────────────────────────────

const userSchema = new Schema(
  {
    name: {
      type:     String,
      required: [true, 'Name is required'],
      trim:     true,
    },
    email: {
      type:      String,
      required:  [true, 'Email is required'],
      unique:    true,
      lowercase: true,
      trim:      true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    passwordHash: {
      type:     String,
      required: [true, 'Password hash is required'],
    },
    role: {
      type:     String,
      enum:     { values: ['admin', 'seller'], message: 'Role must be admin or seller' },
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'users',
  }
);

export const User = mongoose.model('User', userSchema);

// ── PRODUCT ───────────────────────────────────────────────────────────────────

const productSchema = new Schema(
  {
    name: {
      type:     String,
      required: [true, 'Product name is required'],
      trim:     true,
    },
    description: {
      type:    String,
      default: '',
    },
    sku: {
      type:   String,
      sparse: true,
      unique: true,
      trim:   true,
    },
    category: {
      type:    String,
      default: '',
      index:   true,
    },
    unitType: {
      type:     String,
      enum:     { values: ['weight', 'volume', 'count'], message: 'Invalid unit type' },
      required: true,
      index:    true,
    },
    baseUnit: {
      type:     String,
      required: true,
    },
    basePricePaise: {
      type:     Number,
      required: true,
      min:      [0, 'Price cannot be negative'],
    },
    stockInBaseUnits: {
      type:    Number,
      default: 0,
      min:     [0, 'Stock cannot be negative'],
    },
    isActive: {
      type:    Boolean,
      default: true,
      index:   true,
    },
  },
  {
    timestamps: true,
    collection: 'products',
  }
);

// Text index for search
productSchema.index({ name: 'text', category: 'text' });

export const Product = mongoose.model('Product', productSchema);

// ── QUOTATION ─────────────────────────────────────────────────────────────────

const quotationSchema = new Schema(
  {
    sellerId: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },
    status: {
      type:    String,
      enum:    { values: ['pending', 'approved', 'rejected', 'fulfilled'], message: 'Invalid status' },
      default: 'pending',
      index:   true,
    },
    totalAmountPaise: {
      type:     Number,
      required: true,
      min:      [0, 'Total cannot be negative'],
    },
    notes: {
      type:    String,
      default: '',
    },
  },
  {
    timestamps: true,
    collection: 'quotations',
  }
);

export const Quotation = mongoose.model('Quotation', quotationSchema);

// ── QUOTATION ITEM ────────────────────────────────────────────────────────────

const quotationItemSchema = new Schema(
  {
    quotationId: {
      type:     Schema.Types.ObjectId,
      ref:      'Quotation',
      required: true,
      index:    true,
    },
    productId: {
      type:     Schema.Types.ObjectId,
      ref:      'Product',
      required: true,
    },
    orderedQuantity: {
      type:     Number,
      required: true,
    },
    orderedUnit: {
      type:     String,
      required: true,
    },
    quantityInBaseUnits: {
      type:     Number,
      required: true,
    },
    unitPricePaise: {
      type:     Number,
      required: true,
    },
    lineTotalPaise: {
      type:     Number,
      required: true,
    },
  },
  {
    collection: 'quotationitems',
  }
);

export const QuotationItem = mongoose.model('QuotationItem', quotationItemSchema);

// ── PRODUCT REQUEST ───────────────────────────────────────────────────────────

const productRequestSchema = new Schema(
  {
    sellerId: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },
    sellerName: {
      type:     String,
      required: true,
    },
    sellerEmail: {
      type:     String,
      required: true,
    },
    name: {
      type:     String,
      required: [true, 'Chemical/Product name is required'],
      trim:     true,
    },
    category: {
      type:     String,
      required: true,
    },
    unitType: {
      type:     String,
      enum:     { values: ['weight', 'volume', 'count'], message: 'Invalid unit type' },
      required: true,
    },
    quantity: {
      type:     Number,
      required: true,
      min:      [0.000001, 'Quantity must be positive'],
    },
    unit: {
      type:     String,
      required: true,
    },
    description: {
      type:     String,
      default:  '',
    },
    status: {
      type:     String,
      enum:     { values: ['pending', 'approved', 'rejected'], message: 'Invalid status' },
      default:  'pending',
      index:    true,
    },
  },
  {
    timestamps: true,
    collection: 'productrequests',
  }
);

export const ProductRequest = mongoose.model('ProductRequest', productRequestSchema);
