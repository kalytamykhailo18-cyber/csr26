// CSR26 Admin Transaction Manager
// Admin interface for viewing, filtering, and managing all transactions
// Requirements: List all transactions, filter by date/SKU/merchant/status, export

import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '../../api/apiClient';
import type { Transaction } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';

interface TransactionWithRelations extends Transaction {
  user?: { id: string; email: string; firstName: string | null; lastName: string | null } | null;
  sku?: { code: string; name: string } | null;
  merchant?: { id: string; name: string } | null;
}

interface ManualTransactionForm {
  email: string;
  amount: string;
  paymentMode: string;
  reason: string;
}

const TransactionManager = () => {
  const [transactions, setTransactions] = useState<TransactionWithRelations[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [paymentMode, setPaymentMode] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Manual transaction creation
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState<ManualTransactionForm>({
    email: '',
    amount: '',
    paymentMode: 'CLAIM',
    reason: '',
  });
  const [createLoading, setCreateLoading] = useState(false);

  // Pagination
  const [page, setPage] = useState(0);
  const limit = 20;

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params: Record<string, string | number> = {
        limit,
        offset: page * limit,
      };

      if (search) params.search = search;
      if (paymentMode) params.paymentMode = paymentMode;
      if (paymentStatus) params.paymentStatus = paymentStatus;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await adminApi.getAllTransactions(params);
      setTransactions(response.data.data.transactions);
      setTotal(response.data.data.total);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [page, search, paymentMode, paymentStatus, startDate, endDate]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleFilter = () => {
    setPage(0);
    fetchTransactions();
  };

  const handleClearFilters = () => {
    setSearch('');
    setPaymentMode('');
    setPaymentStatus('');
    setStartDate('');
    setEndDate('');
    setPage(0);
  };

  const handleUpdateStatus = async (transactionId: string, newStatus: 'PENDING' | 'COMPLETED' | 'FAILED') => {
    try {
      await adminApi.updateTransactionStatus(transactionId, newStatus);
      fetchTransactions();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleExport = () => {
    // Build CSV content
    const headers = ['Date', 'User Email', 'Payment Mode', 'Amount (EUR)', 'Impact (kg)', 'Status', 'Merchant', 'SKU'];
    const rows = transactions.map(t => [
      new Date(t.createdAt).toLocaleDateString(),
      t.user?.email || '',
      t.paymentMode,
      Number(t.amount).toFixed(2),
      Number(t.impactKg).toFixed(4),
      t.paymentStatus,
      t.merchant?.name || '',
      t.sku?.code || '',
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateManualTransaction = async () => {
    if (!createForm.email || !createForm.amount || !createForm.reason) return;
    setCreateLoading(true);
    setError(null);

    try {
      await adminApi.createManualTransaction({
        email: createForm.email,
        amount: parseFloat(createForm.amount),
        paymentMode: createForm.paymentMode,
        reason: createForm.reason,
      });
      setCreateDialogOpen(false);
      setCreateForm({ email: '', amount: '', paymentMode: 'CLAIM', reason: '' });
      fetchTransactions();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCreateLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Transaction Management</h3>
          <p className="text-sm text-gray-600">{total} total transactions</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCreateDialogOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            Create Manual
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 rounded-md p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Email or name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">All</option>
              <option value="CLAIM">CLAIM</option>
              <option value="PAY">PAY</option>
              <option value="GIFT_CARD">GIFT_CARD</option>
              <option value="ALLOCATION">ALLOCATION</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">All</option>
              <option value="PENDING">PENDING</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="FAILED">FAILED</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleFilter}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            Apply Filters
          </button>
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="large" />
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">User</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Mode</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-700">Amount</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-700">Impact</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Merchant</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-800">{t.user?.email || '-'}</div>
                      {t.user?.firstName && (
                        <div className="text-xs text-gray-500">
                          {t.user.firstName} {t.user.lastName}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                        {t.paymentMode}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {Number(t.amount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {Number(t.impactKg).toFixed(2)} kg
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          t.paymentStatus === 'COMPLETED'
                            ? 'bg-green-100 text-green-700'
                            : t.paymentStatus === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {t.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {t.merchant?.name || '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {t.paymentStatus === 'PENDING' && (
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={() => handleUpdateStatus(t.id, 'COMPLETED')}
                            className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
                          >
                            Complete
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(t.id, 'FAILED')}
                            className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                          >
                            Fail
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Showing {page * limit + 1}-{Math.min((page + 1) * limit, total)} of {total}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Manual Transaction Dialog */}
      {createDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-md shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Create Manual Transaction</h3>
            <p className="text-sm text-gray-500 mb-4">
              Use this for corrections or manual adjustments. A reason is required for audit trail.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User Email *</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="user@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (EUR) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={createForm.amount}
                  onChange={(e) => setCreateForm({ ...createForm, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="10.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
                <select
                  value={createForm.paymentMode}
                  onChange={(e) => setCreateForm({ ...createForm, paymentMode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="CLAIM">CLAIM</option>
                  <option value="PAY">PAY</option>
                  <option value="GIFT_CARD">GIFT_CARD</option>
                  <option value="ALLOCATION">ALLOCATION</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                <textarea
                  value={createForm.reason}
                  onChange={(e) => setCreateForm({ ...createForm, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Enter reason for manual transaction (e.g., correction, refund adjustment)"
                  required
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  onClick={handleCreateManualTransaction}
                  disabled={createLoading || !createForm.email || !createForm.amount || !createForm.reason}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {createLoading ? 'Creating...' : 'Create Transaction'}
                </button>
                <button
                  onClick={() => {
                    setCreateDialogOpen(false);
                    setCreateForm({ email: '', amount: '', paymentMode: 'CLAIM', reason: '' });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionManager;
