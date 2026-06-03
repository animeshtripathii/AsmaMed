/**
 * client/src/pages/admin/QuotationDetailPage.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * ADMIN QUOTATION DETAIL — /admin/quotations/:id
 * Full detailed panel showing the selected seller quotation. Demonstrates
 * strict unit conversion transparency and requires confirmation before updates.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, FileText, CheckCircle, XCircle, Package, Loader2 } from 'lucide-react';
import { getAdminQuotationById, updateQuotationStatus } from '@/api/quotations';
import { formatINR, formatDate, truncateId, formatQuantity } from '@/utils/formatters';
import StatusBadge from '@/components/ui/StatusBadge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

const AdminQuotationDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quotation, setQuotation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Status Action States
  const [pendingStatusChange, setPendingStatusChange] = useState(null); // 'approved' | 'rejected' | 'fulfilled'
  const [isUpdating, setIsUpdating] = useState(false);

  const loadQuotation = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAdminQuotationById(id);
      setQuotation(data);
    } catch (err) {
      console.error('[QuotationDetail] Load error:', err);
      setError('Failed to load quotation details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadQuotation();
    }
  }, [id]);

  const handleStatusConfirm = async () => {
    if (!pendingStatusChange) return;
    setIsUpdating(true);
    setError(null);
    try {
      const updated = await updateQuotationStatus(id, pendingStatusChange);
      setQuotation(updated);
      setPendingStatusChange(null);
    } catch (err) {
      console.error('[QuotationDetail] Update status error:', err);
      setError('Failed to update quotation status.');
    } finally {
      setIsUpdating(false);
    }
  };

  const getConversionNote = (orderedUnit, baseUnit) => {
    if (orderedUnit === 'kg' && baseUnit === 'g') return '× 1000 (kg → g)';
    if (orderedUnit === 'L' && baseUnit === 'mL') return '× 1000 (L → mL)';
    return null;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="h-7 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-56 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="h-8 w-24 bg-gray-200 rounded-full animate-pulse" />
        </div>
        <div className="h-32 bg-white rounded-xl border border-gray-200 animate-pulse" />
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="rounded-lg bg-red-50 p-6 text-red-700 flex items-center gap-2 font-sans">
        <AlertCircle size={20} />
        <span>{error ?? 'Quotation not found.'}</span>
      </div>
    );
  }

  const { status, items = [] } = quotation;
  const itemsText = items.length === 1 ? '1 line item' : `${items.length} line items`;

  return (
    <div className="max-w-4xl space-y-6">
      {/* Top Navigation & Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <button
            onClick={() => navigate('/admin/quotations')}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors focus:outline-none mb-1 font-sans"
          >
            <ArrowLeft size={14} />
            <span>Quotations</span>
          </button>
          <h1 className="text-xl font-bold text-gray-900 font-mono">
            #{truncateId(quotation.id)}
          </h1>
          <div className="font-sans">
            <p className="text-sm font-semibold text-gray-800">{quotation.sellerName}</p>
            <p className="text-xs text-gray-400 font-mono mt-0.5">{quotation.sellerEmail}</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-2 font-sans">
            <Calendar size={12} className="text-gray-400" />
            <span>Submitted {formatDate(quotation.createdAt)}</span>
          </div>
        </div>
        <div>
          <StatusBadge status={status} />
        </div>
      </div>

      {/* Seller Notes Card */}
      {quotation.notes && (
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
          <div className="flex items-center gap-1.5 text-gray-400 mb-1">
            <FileText size={14} />
            <span className="text-xs font-semibold uppercase tracking-wide">Seller Notes</span>
          </div>
          <p className="text-sm text-gray-600 italic font-sans mt-1">"{quotation.notes}"</p>
        </div>
      )}

      {/* Line Items Table Card */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3 font-sans">Product</th>
                <th className="px-4 py-3 font-sans">Ordered As</th>
                <th className="px-4 py-3 font-sans">Base Equivalent</th>
                <th className="px-4 py-3 font-sans">Unit Price</th>
                <th className="px-4 py-3 text-right pr-6 font-sans">Line Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const convNote = getConversionNote(item.orderedUnit, item.baseUnit);
                return (
                  <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    {/* Product Name */}
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-gray-800">{item.productName}</p>
                      <p className="text-xs font-mono text-gray-400 mt-0.5">{item.sku}</p>
                    </td>
                    {/* Ordered As */}
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-purple-700 font-sans">
                        {formatQuantity(item.orderedQty, item.orderedUnit)}
                      </p>
                      <p className="text-xs text-gray-400 font-sans">as ordered</p>
                    </td>
                    {/* Base Equivalent */}
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-gray-700 font-sans">
                        {formatQuantity(item.baseQty, item.baseUnit)}
                      </p>
                      <p className="text-xs text-gray-400 font-sans">stored in DB</p>
                      {convNote && (
                        <p className="text-xs text-purple-500 font-medium font-sans mt-0.5">{convNote}</p>
                      )}
                    </td>
                    {/* Unit Price */}
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-600 font-sans">
                        {formatINR(item.unitPriceINR)} / {item.baseUnit}
                      </p>
                      <p className="text-xs text-gray-400 font-sans">per base unit</p>
                    </td>
                    {/* Line Total */}
                    <td className="px-4 py-3 text-right pr-6">
                      <p className="text-sm font-bold text-gray-900 font-sans">
                        {formatINR(item.lineTotalINR)}
                      </p>
                      <p className="text-xs text-gray-400 font-sans mt-0.5">
                        {item.baseQty} × {formatINR(item.unitPriceINR)}
                      </p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Grand Total Row */}
        <div className="bg-gray-50 border-t border-gray-100 px-6 py-4 flex justify-between items-center">
          <div className="font-sans">
            <span className="text-sm text-gray-500 font-medium">Grand total</span>
            <span className="text-xs text-gray-400 ml-2">· {itemsText}</span>
          </div>
          <div className="text-xl font-bold text-gray-900 font-sans">
            {formatINR(quotation.totalAmountINR)}
          </div>
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="flex gap-3">
        {status === 'pending' && (
          <>
            <button
              onClick={() => setPendingStatusChange('approved')}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium flex-1 flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <CheckCircle size={16} />
              <span>✓ Approve</span>
            </button>
            <button
              onClick={() => setPendingStatusChange('rejected')}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium flex-1 flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <XCircle size={16} />
              <span>✗ Reject</span>
            </button>
          </>
        )}
        {status === 'approved' && (
          <button
            onClick={() => setPendingStatusChange('fulfilled')}
            className="bg-purple-700 hover:bg-purple-800 text-white px-6 py-2.5 rounded-lg text-sm font-medium flex-1 flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <Package size={16} />
            <span>Mark as Fulfilled</span>
          </button>
        )}
        {(status === 'rejected' || status === 'fulfilled') && (
          <div className="bg-gray-100 border border-gray-200 text-gray-500 rounded-xl p-4 text-center text-xs font-semibold w-full font-sans capitalize">
            Quotation is {status} (Read-only)
          </div>
        )}
      </div>

      {/* Confirm Action Dialog */}
      <ConfirmDialog
        isOpen={pendingStatusChange !== null}
        title={`${pendingStatusChange === 'approved' ? 'Approve' : pendingStatusChange === 'rejected' ? 'Reject' : 'Fulfill'} Quotation?`}
        message={`Are you sure you want to mark this quotation as ${pendingStatusChange}? This action will update the system logs and cannot be undone.`}
        confirmLabel="Proceed"
        confirmVariant={pendingStatusChange === 'rejected' ? 'danger' : 'warning'}
        onConfirm={handleStatusConfirm}
        onCancel={() => setPendingStatusChange(null)}
      />
    </div>
  );
};

export default AdminQuotationDetailPage;
