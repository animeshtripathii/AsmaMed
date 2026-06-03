/**
 * client/src/pages/seller/QuotationsPage.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * SELLER QUOTATIONS LIST — /seller/quotations
 * Displays the purchase quotations history of the logged-in seller, including
 * status badges, item counts, split date-time displays, and success toasts.
 * Matches Screen 6 top right panel.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, ClipboardList, AlertCircle, CheckCircle } from 'lucide-react';
import { getMyQuotations } from '@/api/quotations';
import { formatINR, truncateId } from '@/utils/formatters';
import StatusBadge from '@/components/ui/StatusBadge';

const SellerQuotationsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [quotations, setQuotations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Toast notification state
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    // Show green success toast if navigated from Cart submission
    if (location.state?.success) {
      setShowToast(true);
      const timer = setTimeout(() => setShowToast(false), 4000);
      
      // Clean up location state to avoid showing toast on refresh
      window.history.replaceState({}, document.title);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  useEffect(() => {
    setIsLoading(true);
    getMyQuotations()
      .then((data) => {
        setQuotations(data || []);
      })
      .catch((err) => {
        console.error('[SellerQuotations] Load error:', err);
        setError('Failed to load your quotation history.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const formatSplitDate = (isoString) => {
    if (!isoString) return { date: '—', time: '' };
    const dateObj = new Date(isoString);
    const dateStr = dateObj.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const timeStr = dateObj.toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return { date: dateStr, time: timeStr };
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden animate-pulse">
          <div className="px-6 py-4 border-b border-gray-100 flex gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-4 w-20 bg-gray-200 rounded" />
            ))}
          </div>
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="h-6 w-20 bg-gray-100 rounded" />
                <div className="h-6 w-32 bg-gray-100 rounded" />
                <div className="h-6 w-16 bg-gray-100 rounded" />
                <div className="h-6 w-20 bg-gray-100 rounded" />
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
      <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-600 text-sm font-sans">
        <AlertCircle size={16} />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in relative">
      {/* Toast Success Notification */}
      {showToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-green-50 border border-green-200 rounded-xl px-5 py-3 shadow-lg flex items-center gap-3 animate-slide-up">
          <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-green-800 font-sans">Quotation Submitted!</p>
            <p className="text-xs text-green-600 font-sans">Your order request was placed successfully.</p>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 font-sans inline">My Quotations</h1>
        <span className="text-sm text-gray-400 font-normal ml-2 font-sans">
          ({quotations.length} total)
        </span>
      </div>

      {/* Table Card */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-6 py-3 font-sans">ID</th>
                <th className="px-6 py-3 font-sans">Submitted</th>
                <th className="px-6 py-3 font-sans">Items</th>
                <th className="px-6 py-3 text-right font-sans">Total</th>
                <th className="px-6 py-3 text-center font-sans">Status</th>
                <th className="px-6 py-3 text-center pr-6 font-sans">Action</th>
              </tr>
            </thead>
            <tbody>
              {quotations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-sans">
                    <div className="flex flex-col items-center gap-3">
                      <ClipboardList size={36} className="text-gray-300" />
                      <p className="text-sm font-semibold text-gray-400">No quotations yet</p>
                      <button
                        onClick={() => navigate('/seller/products')}
                        className="mt-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold py-2 px-4 rounded-lg transition-colors shadow-sm"
                      >
                        Browse Products
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                quotations.map((q) => {
                  const amt = q.totalAmountINR ?? (q.totalAmountPaise ? q.totalAmountPaise / 100 : 0);
                  const splitTime = formatSplitDate(q.createdAt);
                  const itemsText = q.itemCount === 1 ? '1 item' : `${q.itemCount} items`;

                  return (
                    <tr
                      key={q.id}
                      onClick={() => navigate(`/seller/quotations/${q.id}`)}
                      className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      {/* ID */}
                      <td className="px-6 py-4 font-mono text-gray-400 text-xs">
                        {truncateId(q.id)}
                      </td>
                      {/* Date & Time (split into two lines) */}
                      <td className="px-6 py-4 font-sans">
                        <p className="text-sm text-gray-800 font-medium">{splitTime.date}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{splitTime.time}</p>
                      </td>
                      {/* Items */}
                      <td className="px-6 py-4 font-sans text-gray-600">
                        {itemsText}
                      </td>
                      {/* Total */}
                      <td className="px-6 py-4 text-right font-sans font-bold text-gray-900">
                        {formatINR(amt)}
                      </td>
                      {/* Status */}
                      <td className="px-6 py-4 text-center">
                        <StatusBadge status={q.status} />
                      </td>
                      {/* Action */}
                      <td className="px-6 py-4 text-center pr-6" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => navigate(`/seller/quotations/${q.id}`)}
                          className="border border-gray-200 hover:border-purple-200 hover:text-purple-750 text-xs text-gray-500 px-3 py-1.5 rounded-lg font-medium flex items-center justify-center gap-1 mx-auto transition-colors"
                        >
                          <Eye size={12} />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SellerQuotationsPage;
