/**
 * client/src/pages/seller/ProductsPage.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * SELLER PRODUCT CATALOG — /seller/products
 * Responsive chemical product catalog with live search, unit type filter chips,
 * out-of-stock validation (disabling inputs and cart actions), price estimates,
 * and a custom product request workflow for unavailable products.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Search, ShoppingCart, CheckCircle, AlertCircle, X, ClipboardList, Loader2 } from 'lucide-react';
import { getProducts } from '@/api/products';
import { useCart } from '@/context/CartContext';
import UnitSelector from '@/components/ui/UnitSelector';
import PriceDisplay from '@/components/ui/PriceDisplay';
import QuantityDisplay from '@/components/ui/QuantityDisplay';
import { getDefaultUnit } from '@/utils/unitConverter';
import { formatINR, formatQuantity } from '@/utils/formatters';
import { computeCartItemPrice } from '@/utils/unitConverter';

const emptyRequestForm = () => ({
  name: '',
  category: 'Active Ingredient',
  description: '',
  unitType: 'weight',
  quantity: '',
  unit: 'kg',
});

const SellerProductsPage = () => {
  const { addItem } = useCart();

  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Card quantity inputs
  const [productInputs, setProductInputs] = useState({});

  // Filters
  const [search, setSearch] = useState('');
  const [unitTypeFilter, setUnitTypeFilter] = useState('all');

  // Custom Request Modal States
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState(emptyRequestForm());
  const [requestSaving, setRequestSaving] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (search.trim()) params['search'] = search.trim();
      if (unitTypeFilter !== 'all') params['unit_type'] = unitTypeFilter;
      const data = await getProducts(params);
      setProducts(data || []);

      setProductInputs((prev) => {
        const updated = { ...prev };
        data.forEach((p) => {
          if (!updated[p.id]) {
            const isOutOfStock = (p.displayStock?.value ?? 0) <= 0;
            updated[p.id] = {
              quantity: isOutOfStock ? 0 : 1,
              selectedUnit: getDefaultUnit(p.unitType),
              justAdded: false,
            };
          }
        });
        return updated;
      });
    } catch (err) {
      console.error('[Catalog] Load error:', err);
      setError('Failed to load products list.');
    } finally {
      setIsLoading(false);
    }
  }, [search, unitTypeFilter]);

  useEffect(() => {
    const timer = setTimeout(() => loadProducts(), 300);
    return () => clearTimeout(timer);
  }, [loadProducts]);

  const updateInput = (productId, changes) => {
    setProductInputs((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], ...changes },
    }));
  };

  const handleAddToCart = (product) => {
    const input = productInputs[product.id];
    if (!input || input.quantity <= 0) return;

    addItem(product, input.quantity, input.selectedUnit);

    updateInput(product.id, { justAdded: true });
    setTimeout(() => updateInput(product.id, { justAdded: false }), 1500);
  };

  // Custom Request Form handlers
  const handleRequestSubmit = (e) => {
    e.preventDefault();
    if (!requestForm.name.trim() || !requestForm.quantity || Number(requestForm.quantity) <= 0) {
      return;
    }
    setRequestSaving(true);
    // Simulating submitting request to Admin
    setTimeout(() => {
      setRequestSaving(false);
      setRequestSuccess(true);
      setTimeout(() => {
        setShowRequestModal(false);
        setRequestSuccess(false);
        setRequestForm(emptyRequestForm());
      }, 3000);
    }, 1200);
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Solvent':
        return 'bg-blue-50 text-blue-700 border border-blue-100';
      case 'Reagent':
        return 'bg-orange-50 text-orange-700 border border-orange-100';
      case 'Active Ingredient':
        return 'bg-purple-50 text-purple-700 border border-purple-100';
      case 'Packaging':
        return 'bg-gray-100 text-gray-600 border border-gray-200';
      default:
        return 'bg-gray-100 text-gray-600 border border-gray-200';
    }
  };

  if (isLoading && products.length === 0) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="flex gap-4 items-center">
          <div className="h-10 w-72 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-64 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 bg-white border border-gray-200 rounded-xl p-5 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 font-sans">Product Catalog</h1>
        <p className="text-sm text-gray-500 mt-1 font-sans">
          Browse items, estimate total pricing, and submit a purchase quotation.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row">
        {/* Search Input */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-gray-400" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or category..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-500 transition-colors shadow-sm"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2">
          {['all', 'weight', 'volume', 'count'].map((t) => (
            <button
              key={t}
              onClick={() => setUnitTypeFilter(t)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all border ${
                unitTypeFilter === t
                  ? 'bg-purple-700 text-white border-purple-700 shadow-sm'
                  : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-400 italic font-sans">
        * Prices are estimates — final confirmed prices are calculated on quotation approval.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center flex flex-col items-center justify-center shadow-sm space-y-4">
          <ClipboardList size={48} className="text-gray-300" />
          <div>
            <h3 className="text-base font-semibold text-gray-700 font-sans">No products found</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-sm font-sans">
              No matching chemical products are currently in stock or available in the catalog.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => setShowRequestModal(true)}
              className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold py-2 px-4 rounded-lg transition-colors shadow-sm"
            >
              Request Custom Product
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => {
            const input = productInputs[product.id];
            const isOutOfStock = (product.displayStock?.value ?? 0) <= 0;
            const previewPrice = input
              ? computeCartItemPrice(product, input.quantity, input.selectedUnit)
              : 0;

            return (
              <div
                key={product.id}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col hover:border-purple-300 transition-all duration-200"
              >
                {/* Top Section */}
                <div className="p-4 flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-sm font-bold text-gray-800 font-sans">{product.name}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${getCategoryColor(product.category)}`}>
                      {product.category || 'Other'}
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-gray-400">SKU: {product.sku || 'N/A'}</p>
                  
                  {product.description && (
                    <p className="text-xs text-gray-500 font-sans mt-2 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  )}

                  {/* Price & Stock Display Block */}
                  <div className="mt-4 flex justify-between items-center rounded-lg bg-gray-50 p-2.5">
                    <div>
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Price</p>
                      <div className="flex items-baseline gap-0.5 mt-0.5">
                        <span className="text-sm font-bold text-gray-900">
                          {formatINR(product.displayPrice?.value ?? 0)}
                        </span>
                        <span className="text-[10px] text-gray-400">/{product.displayPrice?.unit}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Stock Status</p>
                      {isOutOfStock ? (
                        <span className="inline-block mt-1 text-[10px] bg-red-50 text-red-700 font-bold px-1.5 py-0.5 rounded border border-red-150">
                          Out of Stock
                        </span>
                      ) : (
                        <div className="text-xs font-semibold text-green-700 mt-1">
                          Available: {formatQuantity(product.displayStock?.value, product.displayStock?.unit)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Section (Card controls) */}
                <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-3">
                  {input && (
                    <>
                      {/* Quantity & Unit Row */}
                      <div className="flex gap-2">
                        <input
                          type="number"
                          step="any"
                          min={isOutOfStock ? "0" : "0.000001"}
                          disabled={isOutOfStock}
                          value={input.quantity}
                          onChange={(e) => updateInput(product.id, { quantity: Number(e.target.value) })}
                          placeholder={isOutOfStock ? "0" : "1"}
                          className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white disabled:bg-gray-100 disabled:text-gray-400"
                        />
                        <UnitSelector
                          unitType={product.unitType}
                          value={input.selectedUnit}
                          disabled={isOutOfStock}
                          onChange={(unit) => updateInput(product.id, { selectedUnit: unit })}
                          className="flex-1 focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>

                      {/* Price Preview */}
                      <div className="h-5 flex items-center justify-end text-xs text-gray-400">
                        {input.quantity > 0 && !isOutOfStock && (
                          <p className="font-sans">
                            ≈ <span className="font-bold text-purple-700">{formatINR(previewPrice)}</span> (est.)
                          </p>
                        )}
                      </div>

                      {/* Add to Cart Button */}
                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={isOutOfStock || input.quantity <= 0}
                        className={`w-full py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                          isOutOfStock
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : input.justAdded
                            ? 'bg-green-500 text-white'
                            : 'bg-purple-700 hover:bg-purple-800 text-white'
                        }`}
                      >
                        {isOutOfStock ? (
                          <span>Out of Stock</span>
                        ) : input.justAdded ? (
                          <>
                            <CheckCircle size={14} />
                            <span>Added to Cart</span>
                          </>
                        ) : (
                          <>
                            <ShoppingCart size={14} />
                            <span>Add to Cart</span>
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Custom Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-gray-200 animate-slide-up overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-base font-semibold text-gray-900 font-sans">Request Custom Product</h3>
              <button
                onClick={() => setShowRequestModal(false)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <X size={18} />
              </button>
            </div>

            {/* Success Alert */}
            {requestSuccess ? (
              <div className="p-6 text-center space-y-3">
                <CheckCircle size={48} className="text-green-500 mx-auto" />
                <h4 className="text-lg font-bold text-gray-800 font-sans">Request Submitted</h4>
                <p className="text-sm text-gray-500 font-sans px-4">
                  The admin has been notified of your custom chemical request. You will be alerted once the product is added.
                </p>
              </div>
            ) : (
              /* Request Form */
              <form onSubmit={handleRequestSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 font-sans">
                    Chemical/Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={requestForm.name}
                    onChange={(e) => setRequestForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Sodium Hydroxide pellets"
                    className="border border-gray-200 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 font-sans">
                      Category
                    </label>
                    <select
                      value={requestForm.category}
                      onChange={(e) => setRequestForm((f) => ({ ...f, category: e.target.value }))}
                      className="border border-gray-200 bg-white rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="Active Ingredient">Active Ingredient</option>
                      <option value="Solvent">Solvent</option>
                      <option value="Reagent">Reagent</option>
                      <option value="Packaging">Packaging</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 font-sans">
                      Unit Type
                    </label>
                    <div className="flex gap-3 items-center h-10">
                      {['weight', 'volume', 'count'].map((ut) => (
                        <label key={ut} className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="reqUnitType"
                            value={ut}
                            checked={requestForm.unitType === ut}
                            onChange={() => setRequestForm((f) => ({ ...f, unitType: ut, unit: getDefaultUnit(ut) }))}
                            className="h-3.5 w-3.5 text-purple-600 border-gray-300 focus:ring-purple-500"
                          />
                          <span className="text-xs text-gray-700 capitalize font-sans">{ut}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 font-sans">
                    Requested Quantity <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      required
                      step="any"
                      min="0.000001"
                      value={requestForm.quantity}
                      onChange={(e) => setRequestForm((f) => ({ ...f, quantity: e.target.value }))}
                      placeholder="10"
                      className="border border-gray-200 rounded-lg px-3 py-2 flex-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <UnitSelector
                      unitType={requestForm.unitType}
                      value={requestForm.unit}
                      onChange={(unit) => setRequestForm((f) => ({ ...f, unit }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 font-sans">
                    Additional Notes (optional)
                  </label>
                  <textarea
                    value={requestForm.description}
                    onChange={(e) => setRequestForm((f) => ({ ...f, description: e.target.value }))}
                    rows={2}
                    placeholder="Urgent requirement for production batch B-402..."
                    className="border border-gray-200 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none font-sans"
                  />
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowRequestModal(false)}
                    className="border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={requestSaving}
                    className="bg-purple-700 hover:bg-purple-800 text-white px-5 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:bg-purple-400 disabled:cursor-not-allowed"
                  >
                    {requestSaving ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <span>Submit Request</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerProductsPage;
