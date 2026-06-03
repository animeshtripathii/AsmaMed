# CHANGES.md — AasaMedChem Development Log

A chronological record of what was built and why in each phase.

---

### Phase 1 — Project Scaffold & Config

- Defined monorepo structure: `client/` (Vite React) and `server/` (Express) as sibling directories
- Created `server/package.json` with all Express, pg, bcryptjs, and TypeScript dependencies
- Created `server/tsconfig.json`: strict mode, ES2020 target, `src/` → `dist/` compilation
- Created `client/package.json` with React 18, React Router v6, Axios, Tailwind, and Lucide icons
- Created `client/vite.config.ts` with `/api` proxy to Express and `@/` path alias to `src/`

---

### Phase 2 — Database Schema & Seed Data

- Designed `schema.sql` with four tables: `users`, `products`, `quotations`, `quotation_items`
- Chose `NUMERIC(20,8)` for all price and quantity columns to guarantee exact arithmetic (no IEEE 754 float errors)
- Chose `UUID` primary keys to prevent sequential ID enumeration in URLs
- Decided on base-unit storage strategy: weights in grams, volumes in mL, prices in paise
- Wrote seed data with 5 pharmaceutical products with pre-converted base unit prices
- Added `ON DELETE CASCADE` on `quotation_items.quotation_id` so item cleanup is automatic
- Added indexes on `is_active`, `category`, `unit_type`, `seller_id`, and `status` for query performance

---

### Phase 3 — Express Server, Auth, JWT Middleware

- Created `server/src/index.ts`: CORS configured for frontend URL, JSON body parser, 404 handler, global error handler
- Implemented `server/src/config/db.ts`: `pg.Pool` with SSL for Neon, `query()` helper with slow-query logging, `testConnection()` on startup
- Implemented `server/src/middleware/auth.ts`: `authenticate` middleware verifies Bearer JWT and attaches `req.user`; `requireRole()` factory for role-based access control
- Implemented `server/src/controllers/authController.ts`: login with bcrypt.compare, register with bcrypt.hash, getMe to rehydrate from token
- Used generic "Invalid email or password" message for both wrong email and wrong password (prevents email enumeration)

---

### Phase 4 — Unit Conversion Utility (Core Logic)

- Created `server/src/utils/unitConverter.ts` as the single source of truth for all quantity/price math
- Defined `CONVERSION_FACTORS` record mapping each unit to its base-unit multiplier
- Implemented `convertToBase()` and `convertFromBase()` for quantity conversions
- Implemented `convertPriceToBaseUnitPaise()` and `convertPriceFromBaseUnitPaise()` for price conversions
- Implemented `getSmartDisplayUnit()` to auto-select human-friendly unit (shows "50 kg" not "50000 g")
- Implemented `getAvailableUnits()` to drive dropdown population from server
- Mirrored all functions exactly in `client/src/utils/unitConverter.ts` for client-side cart preview

---

### Phase 5 — Product CRUD API + Conversion at Boundaries

- Created `productController.ts` with `formatProduct()` helper that builds the full API response shape
- Every product in the response includes: `displayPrice`, `basePrice` (raw paise), `displayStock`, and `availableUnits`
- On `createProduct`: incoming price (₹/unit) and stock (qty/unit) are converted to base before INSERT
- On `updateProduct`: reconverts all values — no stale base values possible
- On `deleteProduct`: soft-delete sets `is_active = false` to preserve quotation history integrity
- Added `?search=&category=&unit_type=` query parameters with dynamic WHERE clause building

---

### Phase 6 — Quotation API with Transaction + Conversion

- Created `quotationController.ts` using `pool.connect()` + explicit `BEGIN/COMMIT/ROLLBACK` for atomicity
- For each cart item: fetched product base price, converted ordered qty to base, computed line total
- Stored both `ordered_quantity + ordered_unit` (seller's input) AND `quantity_in_base_units` in `quotation_items`
- This "conversion audit trail" allows admin to see "seller ordered 2 kg" and "stored as 2000 g" transparently
- Seller routes are scoped by `req.user.id` so sellers can only read their own quotations
- Admin `PUT /quotations/:id` validates status is one of the four allowed values before UPDATE

---

### Phase 7 — React App Setup, Routing, Context Providers

- Created `client/src/App.tsx` with React Router v6 nested routes: `/admin/*` and `/seller/*`
- `AdminLayout` and `SellerLayout` handle auth guards with `<Navigate>` redirect on role mismatch
- `AuthProvider` stores JWT in `localStorage`, rehydrates user on mount via `GET /api/auth/me`
- `CartProvider` maintains in-memory cart with `addItem`, `removeItem`, `updateItem`, `clearCart`
- Cart state is ephemeral (not persisted) — cleared after quotation submission or logout
- Created `axiosInstance.ts` with request interceptor (attach Bearer token) and response interceptor (redirect on 401)

---

### Phase 8 — Login Page + Auth Flow

- Built `LoginPage.tsx`: branded card with Flask icon, email/password form, error banner
- Added "Click to fill" demo credential buttons for admin and seller — speeds up hackathon judging
- On submit: calls `AuthContext.login()` which handles API call, localStorage, and redirect
- Redirect logic: `role === 'admin'` → `/admin`, else → `/seller/products`
- Loading spinner shown during authentication; button disabled to prevent double-submit

---

### Phase 9 — Admin: Products Management UI

- Built `AdminProductsPage.tsx` with full CRUD table + inline Add/Edit modals
- `ProductForm` shared component used by both Add and Edit modals to avoid duplication
- Unit type radio (`weight`/`volume`/`count`) drives which unit dropdowns appear via `UnitSelector`
- On unit type change: resets price unit and stock unit to sensible defaults via `getDefaultUnit()`
- Edit modal pre-fills with `displayPrice.value` and `displayPrice.unit` from API (no re-conversion needed)
- Delete shows a confirmation dialog with explanation that products are soft-deleted, not removed

---

### Phase 10 — Admin: Quotations Viewer with Conversion Display

- Built `AdminQuotationsPage.tsx` with status filter chips — calls `getAllQuotations(status)` on change
- Built `AdminQuotationDetailPage.tsx` with a 5-column line-items table
- The "Base Equivalent" column shows converted quantity (e.g. `2000 g`) styled as a monospace indigo badge
- This is the key transparency feature: admin can audit that conversion was applied correctly
- Approve/Reject/Fulfill buttons only appear when status makes them valid (pending → approve/reject; approved → fulfill)

---

### Phase 11 — Seller: Product Catalog + Cart

- Built `SellerProductsPage.tsx` with 3-column responsive grid (1-col mobile, 2-col tablet, 3-col desktop)
- Per-product state (`productInputs` record) holds qty, selectedUnit, and justAdded flag independently for each card
- Search is debounced 400ms to avoid excessive API calls while typing
- Price preview computed with `computeCartItemPrice()` shown below qty input as `≈ ₹900.00 (estimated)`
- "Add to Cart" button turns green with "Added!" text for 1.5 seconds after successful add
- `CartProvider.addItem()` replaces existing cart entry if same product is added again (no duplicates)

---

### Phase 12 — Seller: Cart Review + Quotation Submission

- Built `CartPage.tsx` with inline quantity editing — changes call `updateItem()` from CartContext
- AmberWarning callout clearly labels all prices as estimates ("Final price confirmed on approval")
- Unit dropdowns in cart table let seller correct their unit selection before submitting
- Notes textarea for optional seller instructions
- On "Place Quotation": calls `createQuotation(items, notes)` which transforms `CartItem[]` to API shape
- On success: `clearCart()` is called before navigating to `/seller/quotations`
- Empty cart state shows a helpful "Browse Products" CTA button

---

### Phase 13 — Shared Components, Formatters, Polish

- Created `UnitSelector`, `StatusBadge`, `PriceDisplay`, `QuantityDisplay` as reusable atoms
- `formatters.ts`: `formatINR()` uses `Intl.NumberFormat` with `en-IN` locale for correct Indian grouping
- `getStatusColor()` returns Tailwind class pairs for semantic badge colors (amber/green/red/indigo)
- `formatDate()` uses `Intl.DateTimeFormat` with 12-hour format for user-friendly timestamps
- `truncateId()` shows first 8 chars of UUIDs in tables to save column width
- Added `animate-fade-in` and `animate-slide-up` Tailwind keyframes for modal entrance animations

---

### Phase 14 — README, Env Config, Deployment Prep

- Created `.env.example` with both server and client sections, explaining each variable
- Created `README.md` with architecture diagram, full schema tables, conversion strategy table
- Documented paise storage rationale with the floating-point `0.1 + 0.2` example
- Wrote step-by-step local setup instructions and Vercel + Render deployment guide
- Confirmed bcrypt password hashes are valid for seed data users
- Added `@types/*` packages for all runtime dependencies to satisfy strict TypeScript compilation
