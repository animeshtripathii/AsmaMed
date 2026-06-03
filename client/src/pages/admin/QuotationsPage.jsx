/**
 * client/src/pages/admin/QuotationsPage.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * ADMIN QUOTATIONS LIST — /admin/quotations
 * Displays the list of all seller quotations as beautiful cards instead of a
 * traditional table, matching the Screen 4 left panel. Includes live filter chips.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ChevronRight, ClipboardList, AlertCircle, Loader2 } from 'lucide-react';
import { getAllQuotations } from '@/api/quotations';
import { formatINR, formatDate, truncateId } from '@/utils/formatters';
import StatusBadge from '@/components/ui/StatusBadge';

const STATUS_FILTERS = ['all', 'pending', 'approved', 'rejected', 'fulfilled'];

const AdminQuotationsPage = () => {
  const navigate = useNavigate();

  const [quotations, setQuotations] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadQuotations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Pass status filter to the API
      const status = selectedFilter === 'all' ? undefined : selectedFilter;
      const data = await getAllQuotations(status);
      setQuotations(data || []);
    } catch (err) {
      console.error('[AdminQuotations] Load error:', err);
      setError('Failed to load quotations list.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedFilter]);

  useEffect(() => {
    loadQuotations();
  }, [loadQuotations]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div>
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-64 bg-gray-200 rounded mt-2 animate-pulse" />
        </div>

        {/* Filter Chips Skeleton */}
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-8 w-20 bg-gray-200 rounded-full animate-pulse" />
          ))}
        </div>

        {/* Cards Skeleton */}
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 animate-pulse space-y-3">
              <div className="flex justify-between items-center">
                <div className="h-4 w-24 bg-gray-200 rounded" />
                <div className="h-5 w-20 bg-gray-200 rounded-full" />
              </div>
              <div className="space-y-1.5">
                <div className="h-4 w-40 bg-gray-100 rounded" />
                <div className="h-3.5 w-32 bg-gray-100 rounded" />
              </div>
              <div className="flex justify-between items-center pt-2">
                <div className="h-3.5 w-28 bg-gray-100 rounded" />
                <div className="h-5 w-20 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
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
    <div className="space-y-6 max-w-3xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 font-sans">Quotations</h1>
        <p className="text-sm text-gray-400 mt-1 font-sans">
          Manage and review seller quotations for inventory requests.
        </p>
      </div>

      {/* Filter Chips Row */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((status) => (
          <button
            key={status}
            onClick={() => setSelectedFilter(status)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all border ${
              selectedFilter === status
                ? 'bg-purple-700 text-white border-purple-700 shadow-sm'
                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Quotation List (Card Format) */}
      <div className="space-y-3">
        {quotations.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center flex flex-col items-center justify-center shadow-sm">
            <ClipboardList size={48} className="text-gray-300 mb-4" />
            <h3 className="text-base font-semibold text-gray-500 font-sans">No quotations found</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-xs font-sans">
              There are no quotations matching the selected filter status.
            </p>
          </div>
        ) : (
          quotations.map((q) => {
            const amt = q.totalAmountINR ?? (q.totalAmountPaise ? q.totalAmountPaise / 100 : 0);
            const itemsText = q.itemCount === 1 ? '1 item' : `${q.itemCount} items`;

            return (
              <div
                key={q.id}
                className="bg-white border border-gray-200 rounded-xl p-4 hover:border-purple-300 hover:shadow-sm transition-all duration-200"
              >
                {/* Top Row: ID & StatusBadge */}
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-150">
                      {truncateId(q.id)}
                    </span>
                  </div>
                  <div>
                    <StatusBadge status={q.status} />
                  </div>
                </div>

                {/* Middle Row: Seller Info */}
                <div className="mt-3">
                  <p className="text-sm font-semibold text-gray-800 font-sans">{q.sellerName}</p>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">{q.sellerEmail}</p>
                </div>

                {/* Bottom Row: Date, Count, Total */}
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                  <div className="text-xs text-gray-400 font-sans">
                    {formatDate(q.createdAt)} · <span className="font-semibold text-gray-500">{itemsText}</span>
                  </div>
                  <div className="text-sm font-bold text-gray-900 font-sans">
                    {formatINR(amt)}
                  </div>
                </div>

                {/* View Details Button */}
                <button
                  onClick={() => navigate(`/admin/quotations/${q.id}`)}
                  className="mt-3 w-full border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-purple-700 hover:border-purple-200 py-2 rounded-lg text-sm flex items-center justify-center gap-1.5 transition-colors font-medium"
                >
                  <span>View Details</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminQuotationsPage;
