/**
 * server/src/config/seed.js
 * ─────────────────────────────────────────────────────────────────────────────
 * DATABASE SEED SCRIPT — AasaMedChem (MongoDB)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User, Product, Quotation, QuotationItem } from './models.js';

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is not set in server/.env');
    process.exit(1);
  }

  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(uri);
  console.log('✅ Connected.\n');

  console.log('🗑  Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Product.deleteMany({}),
    Quotation.deleteMany({}),
    QuotationItem.deleteMany({}),
  ]);
  console.log('   Done.\n');

  console.log('👤 Seeding users...');
  const adminHash  = await bcrypt.hash('Admin@123',  10);
  const sellerHash = await bcrypt.hash('Seller@123', 10);

  const [admin, seller] = await User.insertMany([
    {
      name:         'Super Admin',
      email:        'admin@aasa.com',
      passwordHash: adminHash,
      role:         'admin',
    },
    {
      name:         'Test Seller',
      email:        'seller@aasa.com',
      passwordHash: sellerHash,
      role:         'seller',
    },
  ]);

  console.log(`   ✓ Admin:  ${admin.email}`);
  console.log(`   ✓ Seller: ${seller.email}\n`);

  console.log('📦 Seeding products...');
  const products = await Product.insertMany([
    {
      name:             'Paracetamol API',
      description:      'Active Pharmaceutical Ingredient — Paracetamol (Acetaminophen) USP grade. Used in pain relief formulations.',
      sku:              'PAR-001',
      category:         'Active Ingredient',
      unitType:         'weight',
      baseUnit:         'g',
      basePricePaise:   45,
      stockInBaseUnits: 50000,
      isActive:         true,
    },
    {
      name:             'Ethanol 99%',
      description:      'High-purity pharmaceutical grade ethanol. Suitable for extraction, formulation, and sterilisation.',
      sku:              'ETH-001',
      category:         'Solvent',
      unitType:         'volume',
      baseUnit:         'mL',
      basePricePaise:   12,
      stockInBaseUnits: 200000,
      isActive:         true,
    },
    {
      name:             'Aspirin Powder',
      description:      'Pharmaceutical grade acetylsalicylic acid. Fine powder, > 99.5% purity.',
      sku:              'ASP-001',
      category:         'Active Ingredient',
      unitType:         'weight',
      baseUnit:         'g',
      basePricePaise:   38,
      stockInBaseUnits: 30000,
      isActive:         true,
    },
    {
      name:             'Distilled Water',
      description:      'USP purified water. Suitable for formulations, dilutions, and equipment rinsing.',
      sku:              'DW-001',
      category:         'Solvent',
      unitType:         'volume',
      baseUnit:         'mL',
      basePricePaise:   1.5,
      stockInBaseUnits: 500000,
      isActive:         true,
    },
    {
      name:             'Empty Capsules Size 0',
      description:      'Hard gelatin capsule shells, size 0. Capacity: 0.68 mL / 400-500 mg fill.',
      sku:              'CAP-001',
      category:         'Packaging',
      unitType:         'count',
      baseUnit:         'count',
      basePricePaise:   250,
      stockInBaseUnits: 10000,
      isActive:         true,
    },
  ]);

  products.forEach((p) => {
    console.log(`   ✓ ${p.name} (${p.sku}) — ${p.basePricePaise} paise/${p.baseUnit}`);
  });

  console.log('\n🎉 Seed complete!');
  console.log('   Login: admin@aasa.com  / Admin@123');
  console.log('   Login: seller@aasa.com / Seller@123\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
