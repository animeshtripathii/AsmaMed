/**
 * client/src/pages/admin/DashboardPage.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * ADMIN DASHBOARD — /admin
 * Matches Screen 2 exactly with purple/lavender styling and high-fidelity skeletons.
 * Includes Seller Chemical Requests tracking and moderation actions.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, CheckCircle, Clock, IndianRupee, XCircle, Loader2, Check, X } from 'lucide-react';
import { getProducts, getProductRequests, updateProductRequestStatus } from '@/api/products';
import { getAllQuotations } from '@/api/quotations';
import { formatINR, formatDate, truncateId, formatQuantity } from '@/utils/formatters';
import StatusBadge from '@/components/ui/StatusBadge';

const DashboardPage = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [productRequests, setProductRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Loading state for request actions
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [prods, quots, reqs] = await Promise.all([
        getProducts(),
        getAllQuotations(),
        getProductRequests(),
      ]);
      setProducts(prods || []);
      setQuotations(quots || []);
      setProductRequests(reqs || []);
    } catch (err) {
      console.error('[Dashboard] Error loading data:', err);
      setError('Failed to load dashboard data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (requestId, newStatus) => {
    setActionLoadingId(requestId);
    try {
      await updateProductRequestStatus(requestId, newStatus);
      // Update local state directly
      setProductRequests((prev) =>
        prev.map((r) => (r._id === requestId || r.id === requestId ? { ...r, status: newStatus } : r))
      );
    } catch (err) {
      console.error('[Dashboard] Error updating request status:', err);
      alert(err.response?.data?.message ?? 'Failed to update request status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.isActive).length;
  const pendingQuots = quotations.filter((q) => q.status === 'pending').length;
  
  // Calculate total quotation value
  const totalQuotValue = quotations.reduce((sum, q) => {
    const amt = q.totalAmountINR ?? (q.totalAmountPaise ? q.totalAmountPaise / 100 : 0);
    return sum + amt;
  }, 0);

  const statCards = [
    {
      label: 'Total Products',
      value: String(totalProducts),
      icon: <Package size={20} className="text-gray-600" />,
      color: 'bg-gray-100',
    },
    {
      label: 'Active Products',
      value: String(activeProducts),
      icon: <CheckCircle size={20} className="text-green-600" />,
      color: 'bg-green-50',
    },
    {
      label: 'Pending Quotations',
      value: String(pendingQuots),
      icon: <Clock size={20} className="text-amber-600" />,
      color: 'bg-amber-50',
    },
    {
      label: 'Total Quotation Value',
      value: formatINR(totalQuotValue),
      icon: <IndianRupee size={20} className="text-blue-600" />,
      color: 'bg-blue-50',
    },
  ];

  const recentQuotations = [...quotations]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const formattedDate = new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'long',
  }).format(new Date());

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="h-8 w-36 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-56 bg-gray-200 rounded mt-2 animate-pulse" />
          </div>
        </div>

        {/* Stats Row Skeleton */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm animate-pulse">
              <div className="flex justify-between items-start">
                <div className="space-y-3">
                  <div className="h-3 w-24 bg-gray-200 rounded" />
                  <div className="h-7 w-16 bg-gray-200 rounded" />
                </div>
                <div className="h-8 w-8 bg-gray-200 rounded-full" />
              </div>
            </div>
          ))}
        </div>

        {/* Recent Quotations Skeleton */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between">
            <div className="h-5 w-32 bg-gray-200 rounded" />
            <div className="h-4 w-44 bg-gray-200 rounded" />
          </div>
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="h-4 w-20 bg-gray-100 rounded" />
                <div className="h-4 w-40 bg-gray-100 rounded" />
                <div className="h-4 w-24 bg-gray-100 rounded" />
                <div className="h-4 w-16 bg-gray-100 rounded" />
                <div className="h-4 w-20 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center bg-red-50 border border-red-200 rounded-xl p-8 text-center max-w-lg mx-auto mt-12 shadow-sm animate-fade-in">
        <XCircle size={48} className="text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-red-700">Failed to load dashboard data</h3>
        <p className="text-sm text-red-500 mt-2 mb-6 font-sans">
          There was an error communicating with the server. Please check your connection and try again.
        </p>
        <button
          onClick={loadData}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Heading Row */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-sans">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1 font-sans">Overview of your inventory and orders</p>
        </div>
        <div className="text-sm text-gray-400 font-medium font-sans">
          {formattedDate}
        </div>
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide font-sans">
                  {card.label}
                </p>
                <p
                  className={`font-bold text-gray-900 mt-2 font-sans ${
                    card.label === 'Total Quotation Value' ? 'text-2xl' : 'text-3xl'
                  }`}
                >
                  {card.value}
                </p>
              </div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${card.color} flex-shrink-0`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Quotations Section */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="flex justify-between items-center border-b border-gray-100 px-6 py-4 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900 font-sans">Recent Quotations</h2>
          <span className="text-xs text-gray-400 font-sans">Click a row to view details</span>
        </div>

        {recentQuotations.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400 font-sans">
            No quotations found. Create a seller account to submit quotations.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-6 py-3 font-sans">ID</th>
                  <th className="px-6 py-3 font-sans">Seller Name</th>
                  <th className="px-6 py-3 font-sans">Date</th>
                  <th className="px-6 py-3 font-sans">Status</th>
                  <th className="px-6 py-3 text-right font-sans">Total</th>
                </tr>
              </thead>
              <tbody>
                {recentQuotations.map((q) => {
                  const amt = q.totalAmountINR ?? (q.totalAmountPaise ? q.totalAmountPaise / 100 : 0);
                  return (
                    <tr
                      key={q.id}
                      onClick={() => navigate(`/admin/quotations/${q.id}`)}
                      className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 font-mono text-gray-400 text-xs">
                        {truncateId(q.id)}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-700 font-medium text-sm font-sans">{q.sellerName}</p>
                        <p className="text-xs text-gray-400 font-mono">{q.sellerEmail}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-xs font-sans">
                        {formatDate(q.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={q.status} />
                      </td>
                      <td className="px-6 py-4 text-right text-gray-900 font-semibold text-sm font-sans">
                        {formatINR(amt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Seller Chemical Requests Section */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm mt-6">
        <div className="flex justify-between items-center border-b border-gray-100 px-6 py-4 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900 font-sans">Seller Chemical Requests</h2>
          <span className="text-xs text-gray-400 font-sans">Review custom product requests from sellers</span>
        </div>

        {productRequests.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400 font-sans">
            No chemical requests found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-6 py-3 font-sans">Date</th>
                  <th className="px-6 py-3 font-sans">Seller</th>
                  <th className="px-6 py-3 font-sans">Chemical Name</th>
                  <th className="px-6 py-3 font-sans">Category</th>
                  <th className="px-6 py-3 font-sans">Requested Qty</th>
                  <th className="px-6 py-3 font-sans">Status</th>
                  <th className="px-6 py-3 font-sans">Notes</th>
                  <th className="px-6 py-3 text-center font-sans">Actions</th>
                </tr>
              </thead>
              <tbody>
                {productRequests.map((req) => {
                  const isPending = req.status === 'pending';
                  const reqId = req._id ?? req.id;
                  return (
                    <tr key={reqId} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-gray-400 text-xs font-mono">
                        {new Date(req.createdAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-700 font-medium text-sm font-sans">{req.sellerName}</p>
                        <p className="text-xs text-gray-400 font-mono">{req.sellerEmail}</p>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-800 text-sm font-sans">
                        {req.name}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                          req.category === 'Solvent'
                            ? 'bg-blue-50 text-blue-700 border-blue-100'
                            : req.category === 'Reagent'
                            ? 'bg-orange-50 text-orange-700 border-orange-100'
                            : req.category === 'Active Ingredient'
                            ? 'bg-purple-50 text-purple-700 border-purple-100'
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}>
                          {req.category || 'Other'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono font-semibold text-gray-700 text-sm">
                        {formatQuantity(req.quantity, req.unit)}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500 max-w-xs truncate font-sans">
                        {req.description || <span className="text-gray-300 italic">No notes</span>}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {isPending ? (
                          <div className="flex gap-2 justify-center">
                            {actionLoadingId === reqId ? (
                              <Loader2 size={16} className="animate-spin text-purple-700 mx-auto" />
                            ) : (
                              <>
                                <button
                                  onClick={() => handleUpdateStatus(reqId, 'approved')}
                                  className="bg-green-500 hover:bg-green-600 text-white rounded p-1 shadow-sm transition-colors"
                                  title="Approve Request"
                                >
                                  <Check size={14} />
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(reqId, 'rejected')}
                                  className="bg-red-500 hover:bg-red-600 text-white rounded p-1 shadow-sm transition-colors"
                                  title="Reject Request"
                                >
                                  <X size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 font-sans italic">No actions</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
