/**
 * client/src/components/layout/SellerLayout.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * SELLER LAYOUT — Left sidebar navigation with custom light purple theme.
 * Handles authentication, role-based protection, and cart badge indicator.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import {
  Package,
  ShoppingCart,
  ClipboardList,
  LogOut,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';

const SellerLayout = () => {
  const { user, logout, isLoading } = useAuth();
  const { itemCount } = useCart();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 animate-pulse">
        <Loader2 size={32} className="animate-spin text-purple-700" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  const initials = user.name
    ? user.name.slice(0, 2).toUpperCase()
    : 'SU';

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Sidebar - fixed left */}
      <aside className="w-56 h-screen fixed left-0 top-0 bg-[#f5f3f7] border-r border-gray-200 flex flex-col z-20">
        {/* Top logo & subtitle */}
        <div className="p-4 pb-2">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-purple-950 rounded-md flex items-center justify-center">
              <span className="font-bold text-white text-sm font-sans">A</span>
            </div>
            <span className="text-sm font-bold text-purple-950 font-sans">AasaMedChem</span>
          </div>
          <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider ml-10">
            Chemicals Supply
          </span>
        </div>

        <div className="border-b border-gray-200/60 my-2 mx-4" />

        {/* Navigation Links */}
        <nav className="flex-1 px-3 space-y-1 py-2">
          {/* Browse Products */}
          <NavLink
            to="/seller/products"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium w-full transition-colors ${
                isActive
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-purple-900 hover:bg-purple-50'
              }`
            }
          >
            <Package size={16} />
            <span>Browse Products</span>
          </NavLink>

          {/* Cart with Badge */}
          <NavLink
            to="/seller/cart"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium w-full transition-colors ${
                isActive
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-purple-900 hover:bg-purple-50'
              }`
            }
          >
            <ShoppingCart size={16} />
            <span>Cart</span>
            {itemCount > 0 && (
              <span className="bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center ml-auto font-bold animate-pulse">
                {itemCount}
              </span>
            )}
          </NavLink>

          {/* My Quotations */}
          <NavLink
            to="/seller/quotations"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium w-full transition-colors ${
                isActive
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-purple-900 hover:bg-purple-50'
              }`
            }
          >
            <ClipboardList size={16} />
            <span>My Quotations</span>
          </NavLink>
        </nav>

        {/* User profile & Logout */}
        <div className="mt-auto p-4 border-t border-gray-200/60">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-purple-900 flex items-center justify-center text-white text-xs font-bold">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-gray-800 truncate">{user.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="bg-purple-100 text-purple-700 text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                  Seller
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold py-2 rounded-lg transition-colors shadow-sm"
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="ml-56 min-h-screen bg-gray-50 p-8 animate-fade-in">
        <Outlet />
      </main>
    </div>
  );
};

export default SellerLayout;
