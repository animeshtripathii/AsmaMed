/**
 * client/src/App.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * ROOT APPLICATION COMPONENT (JavaScript version)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// ── Context Providers ─────────────────────────────────────────────────────────
import { AuthProvider }  from '@/context/AuthContext';
import { CartProvider }  from '@/context/CartContext';

// ── Layouts ───────────────────────────────────────────────────────────────────
import AdminLayout  from '@/components/layout/AdminLayout';
import SellerLayout from '@/components/layout/SellerLayout';

// ── Auth Pages ────────────────────────────────────────────────────────────────
import LoginPage from '@/pages/auth/LoginPage';

// ── Admin Pages ───────────────────────────────────────────────────────────────
import AdminDashboardPage        from '@/pages/admin/DashboardPage';
import AdminProductsPage         from '@/pages/admin/ProductsPage';
import AdminQuotationsPage       from '@/pages/admin/QuotationsPage';
import AdminQuotationDetailPage  from '@/pages/admin/QuotationDetailPage';

// ── Seller Pages ──────────────────────────────────────────────────────────────
import SellerProductsPage        from '@/pages/seller/ProductsPage';
import SellerCartPage            from '@/pages/seller/CartPage';
import SellerQuotationsPage      from '@/pages/seller/QuotationsPage';
import SellerQuotationDetailPage from '@/pages/seller/QuotationDetailPage';

const App = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />

          <Route path="/admin" element={<AdminLayout />}>
            <Route index                 element={<AdminDashboardPage />} />
            <Route path="products"       element={<AdminProductsPage />} />
            <Route path="quotations"     element={<AdminQuotationsPage />} />
            <Route path="quotations/:id" element={<AdminQuotationDetailPage />} />
          </Route>

          <Route path="/seller" element={<SellerLayout />}>
            <Route index                 element={<Navigate to="/seller/products" replace />} />
            <Route path="products"       element={<SellerProductsPage />} />
            <Route path="cart"           element={<SellerCartPage />} />
            <Route path="quotations"     element={<SellerQuotationsPage />} />
            <Route path="quotations/:id" element={<SellerQuotationDetailPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;
