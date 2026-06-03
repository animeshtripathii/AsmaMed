# AasaMedChem — Inventory & Order Management System

> **Hackathon Project** — A full-stack pharmaceutical inventory and order management web application.

## Live Demo

- **Frontend:** https://aasamedchem.vercel.app *(deploy to Vercel to activate)*
- **Backend API:** https://aasamedchem-api.onrender.com *(deploy to Render to activate)*

---

## Features

### Admin Panel
- **Dashboard** — Stats cards (total products, active products, pending quotations, total revenue) + recent quotations table
- **Products Management** — Full CRUD with modal forms; add/edit/soft-delete; price and stock entered in human units (kg, L), stored in base units (g, mL)
- **Quotations Management** — View all seller quotations; filter by status; line-item detail showing *both* entered unit and converted base unit; approve / reject / fulfill actions

### Seller Portal
- **Product Catalog** — Responsive grid with search and unit-type filter; per-card quantity input + unit selector; real-time price estimate preview; "Add to Cart" with toast feedback
- **Cart** — Review all items; adjust quantities/units inline; price estimate disclaimer; optional notes; "Place Quotation" button
- **My Quotations** — Full history table; detail view with line items and status-contextual messaging

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TypeScript |
| Routing | React Router v6 |
| Styling | Tailwind CSS v3 |
| HTTP Client | Axios |
| Backend | Express.js (Node.js), TypeScript |
| Database | Neon PostgreSQL (serverless) |
| ORM / Driver | `pg` (node-postgres) |
| Auth | JWT (`jsonwebtoken`) + bcrypt |
| Frontend Deploy | Vercel |
| Backend Deploy | Render |

---

## System Design

```
[Browser]
    │  HTTPS requests
    ▼
[React SPA — Vite / Vercel]
    │  Axios (Bearer JWT)
    │  /api/* → Vercel rewrite (prod) or Vite proxy (dev)
    ▼
[Express REST API — Node.js / Render]
    │  pg Pool
    │  SQL queries with parameterised inputs
    ▼
[Neon PostgreSQL — serverless]
    │  NUMERIC(20,8) for prices/quantities
    │  UUID primary keys
    └─ Tables: users, products, quotations, quotation_items
```

---

## Database Schema

### `users`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key, `uuid_generate_v4()` |
| name | TEXT | Display name |
| email | TEXT | Unique, used for login |
| password_hash | TEXT | bcrypt hash (cost 10) |
| role | TEXT | `'admin'` or `'seller'` |
| created_at | TIMESTAMPTZ | Auto-set |

### `products`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| name | TEXT | Product name |
| sku | TEXT | Unique stock-keeping unit |
| category | TEXT | e.g. "Active Ingredient" |
| unit_type | TEXT | `'weight'`, `'volume'`, or `'count'` |
| base_unit | TEXT | `'g'`, `'mL'`, or `'count'` |
| base_price_per_unit | NUMERIC(20,8) | Price in **paise** per base unit |
| stock_in_base_units | NUMERIC(20,8) | Stock in base unit (g, mL, count) |
| is_active | BOOLEAN | Soft-delete flag |

### `quotations`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| seller_id | UUID | Foreign key → users |
| status | TEXT | `pending` → `approved` → `fulfilled` (or `rejected`) |
| total_amount_paise | NUMERIC(20,8) | Grand total in paise |
| notes | TEXT | Optional seller note |

### `quotation_items`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| quotation_id | UUID | Foreign key → quotations |
| product_id | UUID | Foreign key → products |
| ordered_quantity | NUMERIC(20,8) | As the seller entered |
| ordered_unit | TEXT | Unit the seller selected |
| quantity_in_base_units | NUMERIC(20,8) | Converted for storage |
| unit_price_paise | NUMERIC(20,8) | Price snapshot in paise |
| line_total_paise | NUMERIC(20,8) | `base_qty × unit_price` |

---

## Unit Storage & Conversion Strategy

All quantities are stored in **base units** to enable consistent arithmetic without branching logic in SQL queries.

| Display Unit | Base Unit | Conversion Factor | Example |
|---|---|---|---|
| kg | g | ×1000 | 2 kg = 2000 g |
| g | g | ×1 | 500 g = 500 g |
| L | mL | ×1000 | 1.5 L = 1500 mL |
| mL | mL | ×1 | 200 mL = 200 mL |
| count | count | ×1 | 100 = 100 |

**Conversion happens at the API boundary:**
- **Input** (admin sets price in ₹/kg) → `convertPriceToBaseUnitPaise()` before INSERT
- **Input** (seller orders 2 kg) → `convertToBase(2, 'kg') = 2000 g` before INSERT
- **Output** (returning to client) → `getSmartDisplayUnit(50000g) = { value: 50, unit: 'kg' }` before response

---

## Price Storage Strategy

All prices are stored in **paise** (the smallest INR unit, 1 INR = 100 paise) as `NUMERIC(20,8)`.

**Why paise?**
- Integer-like arithmetic avoids IEEE 754 floating-point errors
- `0.1 + 0.2` in JS floats = `0.30000000000000004` — unacceptable for currency
- Paise stored in NUMERIC(20,8) gives exact decimal arithmetic at the DB level

**Why NUMERIC(20,8)?**
- 20 total digits, 8 decimal places
- Maximum value: `999,999,999,999.99999999`
- Handles bulk pharmaceutical quantities (millions of grams) at micro-paise precision

**Example calculation (Paracetamol API):**
```
Admin enters:   ₹450 per kg
Stored as:      (450 × 100) / 1000 = 45 paise per gram

Seller orders:  2 kg  → convertToBase(2, 'kg') = 2000 g
Line total:     2000 g × 45 paise/g = 90,000 paise = ₹900.00
```

---

## Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-username/aasamedchem.git
cd aasamedchem

# 2. Set up the backend
cd server
cp ../.env.example .env
# Edit .env — set DATABASE_URL, JWT_SECRET
npm install

# 3. Set up the database
# Open Neon Console → SQL Editor → paste contents of src/config/schema.sql → Run

# 4. Start the backend
npm run dev  # runs on http://localhost:5000

# 5. Set up the frontend (new terminal)
cd ../client
cp ../.env.example .env.local
# VITE_API_URL can be left blank for dev (Vite proxy handles it)
npm install

# 6. Start the frontend
npm run dev  # runs on http://localhost:5173
```

---

## Deployment

### Frontend → Vercel
1. Push to GitHub
2. Import repo in Vercel dashboard
3. Set root directory to `client/`
4. Add environment variable: `VITE_API_URL=https://your-backend.onrender.com`
5. Deploy

### Backend → Render
1. Create a new **Web Service** in Render
2. Set root directory to `server/`
3. Build command: `npm install && npm run build`
4. Start command: `npm start`
5. Add environment variables: `DATABASE_URL`, `JWT_SECRET`, `CLIENT_URL`

---

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@aasa.com | Admin@123 |
| Seller | seller@aasa.com | Seller@123 |

---

## How to Use

**As Admin:**
1. Log in with admin credentials → redirected to Dashboard
2. Go to Products → click "Add Product" to create inventory
3. Go to Quotations → click any row to view detail
4. Approve, Reject, or Fulfill quotations from the detail page

**As Seller:**
1. Log in with seller credentials → redirected to Product Catalog
2. Set quantity + unit for any product → "Add to Cart"
3. Go to Cart → review items, add notes → "Place Quotation"
4. Go to My Quotations to track status
