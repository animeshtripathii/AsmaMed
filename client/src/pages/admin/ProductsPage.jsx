/**
 * client/src/pages/admin/ProductsPage.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * ADMIN PRODUCTS — /admin/products
 * Full CRUD interface with modal forms, active/inactive statuses, unit type
 * badges, inline unit conversions, live database price hints, and a ConfirmDialog modal.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Pencil, Trash2, X, AlertCircle, Loader2 } from 'lucide-react';
import { getProducts, createProduct, updateProduct, deleteProduct } from '@/api/products';
import { formatINR, formatQuantity } from '@/utils/formatters';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import UnitSelector from '@/components/ui/UnitSelector';
import { getDefaultUnit, convertPriceToBaseUnitPaise, BASE_UNIT_FOR_TYPE } from '@/utils/unitConverter';

const emptyForm = () => ({
  name: '',
  description: '',
  sku: '',
  category: 'Active Ingredient', // Default category
  unitType: 'weight',
  priceINR: '',
  priceUnit: 'kg',
  stockQty: '',
  stockUnit: 'kg',
});

const AdminProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal / Dialog States
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Form State
  const [form, setForm] = useState(emptyForm());
  const [formError, setFormError] = useState(null);
  const [formSaving, setFormSaving] = useState(false);

  // Field validation
  const [fieldErrors, setFieldErrors] = useState({});

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getProducts();
      setProducts(data || []);
    } catch (err) {
      console.error('[Products] Load error:', err);
      setError('Failed to load products list.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Open modal if URL query string has ?add=true (from Sidebar click)
  useEffect(() => {
    if (searchParams.get('add') === 'true') {
      handleOpenAddModal();
      searchParams.delete('add');
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  const handleOpenAddModal = () => {
    setForm(emptyForm());
    setEditingProduct(null);
    setFieldErrors({});
    setFormError(null);
    setShowFormModal(true);
  };

  const handleOpenEditModal = (p) => {
    setEditingProduct(p);
    setForm({
      name: p.name,
      description: p.description || '',
      sku: p.sku || '',
      category: p.category || 'Active Ingredient',
      unitType: p.unitType || 'weight',
      priceINR: p.displayPrice.value,
      priceUnit: p.displayPrice.unit,
      stockQty: p.displayStock.value,
      stockUnit: p.displayStock.unit,
    });
    setFieldErrors({});
    setFormError(null);
    setShowFormModal(true);
  };

  const handleUnitTypeChange = (unitType) => {
    const defaultUnit = getDefaultUnit(unitType);
    setForm((prev) => ({
      ...prev,
      unitType,
      priceUnit: defaultUnit,
      stockUnit: defaultUnit,
    }));
  };

  // Form Validation
  const validateForm = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Product name is required.';
    if (!form.priceINR || Number(form.priceINR) <= 0) {
      errors.priceINR = 'Price must be a positive number.';
    }
    if (!form.stockQty || Number(form.stockQty) < 0) {
      errors.stockQty = 'Stock cannot be negative.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setFormSaving(true);
    setFormError(null);

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      sku: form.sku.trim() || undefined,
      category: form.category,
      unitType: form.unitType,
      priceINR: Number(form.priceINR),
      priceUnit: form.priceUnit,
      stockQty: Number(form.stockQty),
      stockUnit: form.stockUnit,
    };

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
      } else {
        await createProduct(payload);
      }
      setShowFormModal(false);
      await loadProducts();
    } catch (err) {
      console.error('[Products] Submit error:', err);
      setFormError(err.response?.data?.message ?? 'Failed to save product.');
    } finally {
      setFormSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDeleteId) return;
    try {
      await deleteProduct(confirmDeleteId);
      setConfirmDeleteId(null);
      await loadProducts();
    } catch (err) {
      console.error('[Products] Delete error:', err);
      setError('Failed to delete product.');
    }
  };

  // Live price conversion hint calculation
  const getPriceHint = () => {
    const price = Number(form.priceINR) || 0;
    const unit = form.priceUnit;
    const unitType = form.unitType;
    const baseUnit = BASE_UNIT_FOR_TYPE[unitType] || 'g';

    const paiseVal = convertPriceToBaseUnitPaise(price, unit);
    // Display mathematically correct value with up to 6 decimals
    const paiseFormatted = parseFloat(paiseVal.toFixed(6));
    return `Price conversion: ₹${price.toFixed(2)}/${unit} will be stored as ${paiseFormatted} paise per ${baseUnit === 'mL' ? 'milliliter' : baseUnit === 'g' ? 'gram' : 'item'} internally.`;
  };

  // Color mappings
  const getCategoryBadgeClass = (category) => {
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

  const getUnitTypeBadgeClass = (unitType) => {
    switch (unitType) {
      case 'volume':
        return 'bg-blue-50 text-blue-700 rounded-full text-xs px-2 py-0.5 border border-blue-100 font-medium capitalize';
      case 'weight':
        return 'bg-green-50 text-green-700 rounded-full text-xs px-2 py-0.5 border border-green-100 font-medium capitalize';
      case 'count':
        return 'bg-purple-50 text-purple-700 rounded-full text-xs px-2 py-0.5 border border-purple-100 font-medium capitalize';
      default:
        return 'bg-gray-100 text-gray-600 rounded-full text-xs px-2 py-0.5 font-medium capitalize';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
          <div className="px-6 py-4 border-b border-gray-100 flex gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-4 w-20 bg-gray-200 rounded" />
            ))}
          </div>
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="h-6 w-36 bg-gray-100 rounded" />
                <div className="h-6 w-20 bg-gray-100 rounded" />
                <div className="h-6 w-16 bg-gray-100 rounded" />
                <div className="h-6 w-20 bg-gray-100 rounded" />
                <div className="h-6 w-16 bg-gray-100 rounded" />
                <div className="h-6 w-12 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-6 text-red-700 flex items-center gap-2">
        <AlertCircle size={20} />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 inline">Products</h1>
          <span className="text-sm text-gray-400 font-normal ml-2 font-sans">
            ({products.length} products)
          </span>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={16} />
          <span>Add Product</span>
        </button>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3 font-sans">Name & SKU</th>
                <th className="px-4 py-3 font-sans">Category</th>
                <th className="px-4 py-3 font-sans">Unit Type</th>
                <th className="px-4 py-3 font-sans">Price</th>
                <th className="px-4 py-3 font-sans">Stock</th>
                <th className="px-4 py-3 font-sans">Status</th>
                <th className="px-4 py-3 text-right pr-6 font-sans">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400 font-sans">
                    No products found. Add your first product to begin.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const displayPriceVal = p.displayPrice.value;
                  const displayPriceUnit = p.displayPrice.unit;
                  const displayStockVal = p.displayStock.value;
                  const displayStockUnit = p.displayStock.unit;

                  return (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      {/* Name & SKU */}
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-gray-800">{p.name}</p>
                        {p.sku && <p className="text-xs font-mono text-gray-400 mt-0.5">{p.sku}</p>}
                      </td>
                      {/* Category */}
                      <td className="px-4 py-3">
                        <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${getCategoryBadgeClass(p.category)}`}>
                          {p.category || 'Other'}
                        </span>
                      </td>
                      {/* Unit Type */}
                      <td className="px-4 py-3">
                        <span className={getUnitTypeBadgeClass(p.unitType)}>
                          {p.unitType}
                        </span>
                      </td>
                      {/* Price */}
                      <td className="px-4 py-3 font-sans text-gray-800 font-medium">
                        {formatINR(displayPriceVal)} / {displayPriceUnit}
                      </td>
                      {/* Stock */}
                      <td className="px-4 py-3 font-sans text-gray-600">
                        {formatQuantity(displayStockVal, displayStockUnit)}
                      </td>
                      {/* Status */}
                      <td className="px-4 py-3">
                        {p.isActive ? (
                          <span className="bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full border border-green-100 font-medium">
                            Active
                          </span>
                        ) : (
                          <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full border border-gray-200 font-medium">
                            Inactive
                          </span>
                        )}
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3 text-right pr-6">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-50 transition-colors"
                            title="Edit"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(p.id)}
                            className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-gray-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 animate-slide-up">
            {/* Modal Header */}
            <div className="p-6 pb-4 border-b border-gray-100 flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingProduct ? 'Edit Product' : 'Add Product'}
                </h3>
                <p className="text-sm text-gray-400 mt-0.5 font-sans">
                  {editingProduct ? 'Update the product details and pricing.' : 'Create a new product catalog item.'}
                </p>
              </div>
              <button
                onClick={() => setShowFormModal(false)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none p-1 rounded hover:bg-gray-50"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                  <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
                  <span className="text-red-600 text-sm font-medium">{formError}</span>
                </div>
              )}

              {/* Row 1: Name and SKU */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Paracetamol API"
                    className="border border-gray-200 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  {fieldErrors.name && (
                    <p className="text-xs text-red-500 mt-1 font-medium">{fieldErrors.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                  <input
                    type="text"
                    value={form.sku}
                    onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                    placeholder="PCM-220"
                    className="border border-gray-200 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Row 2: Category and Unit Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-sans">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-sans">
                    Unit Type <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4 items-center h-10">
                    {['weight', 'volume', 'count'].map((ut) => (
                      <label key={ut} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="unitType"
                          value={ut}
                          checked={form.unitType === ut}
                          onChange={() => handleUnitTypeChange(ut)}
                          className="h-4 w-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                        />
                        <span className="text-xs text-gray-700 capitalize font-sans">{ut}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 3: Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-sans">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  placeholder="Pharmaceutical grade paracetamol active ingredient."
                  className="border border-gray-200 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none font-sans"
                />
              </div>

              {/* Row 4: Price and Stock */}
              <div className="grid grid-cols-2 gap-4">
                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2 items-center">
                    <span className="text-gray-500 text-sm">₹</span>
                    <input
                      type="number"
                      step="any"
                      value={form.priceINR}
                      onChange={(e) => setForm((f) => ({ ...f, priceINR: e.target.value }))}
                      placeholder="1250.00"
                      className="border border-gray-200 rounded-lg px-3 py-2 flex-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <span className="text-gray-400 text-xs font-sans">per</span>
                    <UnitSelector
                      unitType={form.unitType}
                      value={form.priceUnit}
                      onChange={(unit) => setForm((f) => ({ ...f, priceUnit: unit }))}
                      className="focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 italic mt-1 font-sans leading-tight">
                    {getPriceHint()}
                  </p>
                  {fieldErrors.priceINR && (
                    <p className="text-xs text-red-500 mt-1 font-medium">{fieldErrors.priceINR}</p>
                  )}
                </div>

                {/* Stock */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      step="any"
                      value={form.stockQty}
                      onChange={(e) => setForm((f) => ({ ...f, stockQty: e.target.value }))}
                      placeholder="50"
                      className="border border-gray-200 rounded-lg px-3 py-2 flex-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <UnitSelector
                      unitType={form.unitType}
                      value={form.stockUnit}
                      onChange={(unit) => setForm((f) => ({ ...f, stockUnit: unit }))}
                      className="focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  {fieldErrors.stockQty && (
                    <p className="text-xs text-red-500 mt-1 font-medium">{fieldErrors.stockQty}</p>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 focus:outline-none transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSaving}
                  className="bg-purple-700 hover:bg-purple-800 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors shadow-sm disabled:bg-purple-400 disabled:cursor-not-allowed"
                >
                  {formSaving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span>✓ Save</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDeleteId !== null}
        title="Deactivate product?"
        message="The product will be hidden from sellers but preserved in existing quotations."
        confirmLabel="Deactivate"
        confirmVariant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
};

export default AdminProductsPage;
