/**
 * client/src/pages/seller/CartPage.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * SELLER CART — /seller/cart
 * Displays the current cart contents, calculates estimated prices, allows item
 * removal, includes notes for the admin, and places the purchase quotation.
 * Matches Screen 6 left panel layout.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Send, Loader2, Info, Trash2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { createQuotation } from '@/api/quotations';
import { formatINR } from '@/utils/formatters';

const CartPage = () => {
  const navigate = useNavigate();
  const { items, removeItem, clearCart, cartTotal } = useCart();

  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handlePlaceQuotation = async () => {
    if (items.length === 0) return;
    setIsSubmitting(true);
    setError(null);

    try {
      await createQuotation(items, notes.trim() || undefined);
      clearCart();
      // Navigate to My Quotations page showing success message
      navigate('/seller/quotations', { state: { success: true } });
    } catch (err) {
      console.error('[Cart] Error placing quotation:', err);
      setError(err.response?.data?.message ?? 'Failed to submit quotation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Empty Cart State
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
        <ShoppingCart size={48} className="text-gray-200 mb-4" />
        <h2 className="text-lg font-semibold text-gray-500 font-sans">Your cart is empty</h2>
        <p className="text-xs text-gray-400 mt-1 font-sans">
          Add chemical products from the catalog to request a quotation.
        </p>
        <button
          onClick={() => navigate('/seller/products')}
          className="mt-6 border border-purple-600 text-purple-700 hover:bg-purple-50 px-5 py-2 rounded-lg text-sm font-semibold transition-colors focus:outline-none"
        >
          Browse Products
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 font-sans">Review Cart</h1>
        <p className="text-sm text-gray-500 mt-1 font-sans">
          {items.length} {items.length === 1 ? 'item' : 'items'} ready for quotation
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-600 text-sm animate-fade-in">
          <Info size={16} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column: Cart Table (col-span-3) */}
        <div className="lg:col-span-3 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-6 py-3 font-sans">Product Name</th>
                  <th className="px-6 py-3 text-center font-sans">Qty</th>
                  <th className="px-6 py-3 text-right font-sans">Price Est.</th>
                  <th className="px-6 py-3 text-center font-sans">Remove</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.product.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    {/* Product Name */}
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-gray-800 font-sans">{item.product.name}</p>
                      <p className="text-xs font-mono text-gray-400 mt-0.5">{item.product.sku}</p>
                    </td>
                    {/* Quantity */}
                    <td className="px-6 py-4 text-center font-sans font-semibold text-gray-600">
                      {item.quantity} {item.selectedUnit}
                    </td>
                    {/* Estimated Price */}
                    <td className="px-6 py-4 text-right font-sans font-bold text-gray-800">
                      {formatINR(item.calculatedPrice)}
                    </td>
                    {/* Remove Action */}
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="text-xs text-red-500 hover:text-red-750 font-semibold hover:underline flex items-center justify-center gap-1 mx-auto"
                      >
                        <Trash2 size={13} />
                        <span>Remove</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Order Summary Card (col-span-2) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm sticky top-6">
            <h3 className="text-base font-semibold text-gray-900 font-sans mb-4">Your Order</h3>

            {/* Line Items List */}
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.product.id} className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 truncate w-36 font-sans">
                    {item.product.name}
                  </span>
                  <span className="text-gray-700 font-semibold font-mono">
                    {formatINR(item.calculatedPrice)}
                  </span>
                </div>
              ))}
            </div>

            <div className="my-4 border-t border-gray-100" />

            {/* Estimated Total */}
            <div className="flex justify-between items-baseline mb-4">
              <span className="text-sm font-bold text-gray-700 font-sans">Estimated Total</span>
              <div className="text-right">
                <span className="text-lg font-bold text-gray-900 font-sans">
                  {formatINR(cartTotal)}
                </span>
                <span className="block text-[10px] text-gray-400 italic mt-0.5">(estimate)</span>
              </div>
            </div>

            {/* Notes Section */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 font-sans">
                Notes for admin (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="e.g. Urgent delivery needed"
                className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none font-sans"
              />
            </div>

            {/* Disclaimer box */}
            <div className="mt-4 bg-blue-50 border border-blue-100 rounded-lg p-3 flex gap-2 items-start">
              <Info size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-blue-600 leading-normal font-sans">
                Prices shown are estimates. Final price confirmed on approval by the administrator.
              </p>
            </div>

            {/* Submit Button */}
            <button
              onClick={handlePlaceQuotation}
              disabled={isSubmitting || items.length === 0}
              className="mt-4 w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-sm disabled:bg-green-300 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Placing...</span>
                </>
              ) : (
                <>
                  <Send size={16} />
                  <span>Place Quotation</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
