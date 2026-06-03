# AasaMedChem — Inventory & Order Management System

> **Hackathon Project** — A full-stack pharmaceutical inventory and order management web application.

## Live Demo

- **Frontend:** [https://aasamedchem.vercel.app](https://asma-med.vercel.app) *(deploy to Vercel to activate)*


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
| Frontend | React 18, Vite, JavaScript |
| Routing | React Router v6 |
| Styling | Tailwind CSS v3 |
| HTTP Client | Axios |
| Backend | Express.js (Node.js), JavaScript (ES Modules) |
| Database | MongoDB Atlas |
| ORM / Driver | Mongoose |
| Auth | JWT (`jsonwebtoken`) + bcrypt, secure cookie-based session token (`cookie-parser`) |
| Rate Limiting | `express-rate-limit` |
| Deployment | Vercel (Unified monorepo deployment) |

---

## System Design

```
[Browser]
    │  HTTPS requests (with HTTP-only token cookie)
    ▼
[React SPA — Vite / Vercel]
    │  Axios (withCredentials: true)
    │  /api/* → Vercel serverless routing
    ▼
[Express REST API — Node.js / Vercel Serverless]
    │  Mongoose Connection
    │  MongoDB Queries
    ▼
[MongoDB Atlas Cloud Database]
    │  Double-precision/custom scale arithmetic for prices/quantities
    │  MongoDB ObjectId
    └─ Collections: users, products, quotations, product_requests
```

---

## Database Schema

### `users`
| Field | Type | Notes |
|-------|------|-------|
| _id | ObjectId | Auto-generated primary key |
| name | String | Display name |
| email | String | Unique, used for login |
| passwordHash | String | bcrypt hash |
| role | String | `'admin'` or `'seller'` |
| timestamps | Date | Auto-set `createdAt` and `updatedAt` |

### `products`
| Field | Type | Notes |
|-------|------|-------|
| _id | ObjectId | Primary key |
| name | String | Product name (text index) |
| sku | String | Unique stock-keeping unit |
| category | String | e.g. "Active Ingredient" (text index) |
| unitType | String | `'weight'`, `'volume'`, or `'count'` |
| baseUnit | String | `'g'`, `'mL'`, or `'count'` |
| basePricePaise | Number | Price in **paise** per base unit |
| stockInBaseUnits | Number | Stock in base unit (g, mL, count) |
| isActive | Boolean | Soft-delete flag |

### `quotations`
| Field | Type | Notes |
|-------|------|-------|
| _id | ObjectId | Primary key |
| sellerId | ObjectId | Reference → `User` |
| status | String | `pending` → `approved` → `fulfilled` (or `rejected`) |
| totalAmountPaise | Number | Grand total in paise |
| notes | String | Optional seller note |

### `quotation_items`
| Field | Type | Notes |
|-------|------|-------|
| _id | ObjectId | Primary key |
| quotationId | ObjectId | Reference → `Quotation` |
| productId | ObjectId | Reference → `Product` |
| orderedQuantity | Number | As the seller entered |
| orderedUnit | String | Unit the seller selected |
| quantityInBaseUnits | Number | Converted for storage |
| unitPricePaise | Number | Price snapshot in paise |
| lineTotalPaise | Number | `quantityInBaseUnits * unitPricePaise` |

### `product_requests`
| Field | Type | Notes |
|-------|------|-------|
| _id | ObjectId | Primary key |
| sellerId | ObjectId | Reference → `User` |
| sellerName | String | Seller's name |
| sellerEmail | String | Seller's email |
| name | String | Chemical/Product requested |
| category | String | Category tag |
| unitType | String | `'weight'`, `'volume'`, or `'count'` |
| quantity | Number | Quantity requested |
| unit | String | Unit of measurement |
| description | String | Optional description notes |
| status | String | `'pending'`, `'approved'`, or `'rejected'` |

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
git clone https://github.com/animeshtripathii/AsmaMed.git
cd AsmaMed

# 2. Set up the backend env
cd server
cp ../.env.example .env
# Edit .env — set MONGODB_URI, JWT_SECRET, CLIENT_URL, PORT

# 3. Install backend dependencies and seed the database
npm install
npm run seed

# 4. Start the backend
npm run dev  # runs on http://localhost:5000 (starts express & Mongoose)

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

The project is structured as a unified monorepo for seamless single-click deployment on **Vercel** via the root `vercel.json` routing configuration:

1. Push the repository to GitHub.
2. Import the repository on Vercel.
3. Configure the following environment variables in Vercel settings:
   - `MONGODB_URI`: Your MongoDB Atlas cluster connection string.
   - `JWT_SECRET`: A secure random secret key for session signing.
   - `CLIENT_URL`: The production URL of your Vercel deployment (or leave empty to match the host dynamically).
4. Vercel automatically:
   - Builds the frontend static app via `@vercel/static-build` using Vite.
   - Serves the Express server as an API Serverless Function via `@vercel/node`.
   - Handles rewriting requests from `/api/*` to the server function.

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
