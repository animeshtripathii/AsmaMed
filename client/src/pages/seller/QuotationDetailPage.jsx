/**
 * client/src/pages/seller/QuotationDetailPage.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * SELLER QUOTATION DETAIL — /seller/quotations/:id
 * Displays the details of a single seller quotation in a read-only panel view.
 * Matches Screen 6 bottom right panel.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Calendar, FileText, Package, Loader2, AlertCircle } from 'lucide-react';
import { getQuotationById } from '@/api/quotations';
import { formatINR, formatDate, truncateId, formatQuantity } from '@/utils/formatters';
import StatusBadge from '@/components/ui/StatusBadge';

const SellerQuotationDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quotation, setQuotation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    getQuotationById(id)
      .then((data) => {
        setQuotation(data);
      })
      .catch((err) => {
        console.error('[SellerQuotationDetail] Load error:', err);
        setError('Failed to load quotation details.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
        <div className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse space-y-4">
          <div className="flex justify-between items-center">
            <div className="h-6 w-32 bg-gray-200 rounded" />
            <div className="h-5 w-20 bg-gray-200 rounded-full" />
          </div>
          <div className="h-4 w-56 bg-gray-100 rounded" />
          <div className="h-20 bg-gray-55 bg-opacity-10 rounded" />
        </div>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="rounded-lg bg-red-50 p-6 text-red-700 flex items-center gap-2 font-sans animate-fade-in">
        <AlertCircle size={20} />
        <span>{error ?? 'Quotation not found.'}</span>
      </div>
    );
  }

  const { status, items = [] } = quotation;
  const amt = quotation.totalAmountINR ?? (quotation.totalAmountPaise ? quotation.totalAmountPaise / 100 : 0);

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      {/* Top Row: Back link & Status */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => navigate('/seller/quotations')}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1 font-sans focus:outline-none"
        >
          <ChevronLeft size={16} />
          <span>Back</span>
        </button>
        <StatusBadge status={status} />
      </div>

      {/* Title ID & Date */}
      <div>
        <h2 className="font-mono text-base font-bold text-gray-700 mb-1">
          #{truncateId(quotation.id)}
        </h2>
        <div className="flex items-center gap-1.5 text-xs text-gray-400 font-sans">
          <Calendar size={12} className="text-gray-400" />
          <span>Submitted {formatDate(quotation.createdAt)}</span>
        </div>
      </div>

      {/* Seller Notes */}
      {quotation.notes && (
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 mt-3">
          <div className="flex items-center gap-1.5 text-gray-400 mb-1">
            <FileText size={12} />
            <span className="text-xs font-semibold uppercase tracking-wide">Seller Notes</span>
          </div>
          <p className="text-xs text-gray-600 italic font-sans">"{quotation.notes}"</p>
        </div>
      )}

      {/* Line Items Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mt-4 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-6 py-3 font-sans">Product</th>
                <th className="px-6 py-3 font-sans text-center">Qty</th>
                <th className="px-6 py-3 text-right pr-6 font-sans">Line Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  {/* Product */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50">
                        <Package size={14} className="text-gray-450" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 font-sans">{item.productName}</p>
                        <p className="text-[10px] font-mono text-gray-400 mt-0.5">{item.sku}</p>
                      </div>
                    </div>
                  </td>
                  {/* Quantity */}
                  <td className="px-6 py-4 text-center font-sans font-semibold text-gray-600">
                    {formatQuantity(item.orderedQty, item.orderedUnit)}
                  </td>
                  {/* Line Total */}
                  <td className="px-6 py-4 text-right pr-6 font-sans font-bold text-gray-900">
                    {formatINR(item.lineTotalINR)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Confirmed Total Row */}
        <div className="bg-gray-50 border-t px-6 py-4 flex justify-between items-center">
          <span className="text-sm font-semibold text-gray-500 font-sans">Confirmed Total</span>
          <span className="text-base font-bold text-gray-900 font-sans">
            {formatINR(amt)}
          </span>
        </div>
      </div>

      {/* Contextual Status Help Notes */}
      <div className="mt-4">
        {status === 'pending' && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 font-sans leading-relaxed">
            Your quotation is currently pending review by the administrator. Estimated prices will be verified and adjusted against current inventory stock upon approval.
          </div>
        )}
        {status === 'approved' && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-xs text-green-800 font-sans leading-relaxed">
            Your quotation has been approved! The administrator has verified stock limits. Order fulfillment will begin shortly.
          </div>
        )}
        {status === 'fulfilled' && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-800 font-sans leading-relaxed">
            This order has been fulfilled. The stock has been deducted, and delivery logistics are in progress. Thank you!
          </div>
        )}
        {status === 'rejected' && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800 font-sans leading-relaxed">
            This quotation request was rejected. This usually occurs due to stock depletion or price discrepancies. Please coordinate directly with the inventory administrator.
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerQuotationDetailPage;
