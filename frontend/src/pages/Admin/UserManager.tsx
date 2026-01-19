// CSR26 Admin User Manager
// View and manage platform users
// RULE: Use HTML + Tailwind for layout, MUI only for interactive components

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchAllUsers, fetchUserById, adjustUserWallet, clearSelectedUser } from '../../store/slices/userSlice';
import { userApi } from '../../api/apiClient';
import type { UserStatus, UserWithCounts } from '../../types';
import { formatEUR, formatWeightKg, formatDate } from '../../utils/formatters';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import DownloadIcon from '@mui/icons-material/Download';

const UserManager = () => {
  const dispatch = useAppDispatch();
  const { users, total, selectedUser, loading, error } = useAppSelector((state) => state.user);

  // Local state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | UserStatus>('all');
  const [page, setPage] = useState(0);
  const pageSize = 20;

  // Detail dialog state
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Wallet adjustment state
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustSuccess, setAdjustSuccess] = useState(false);

  // Fetch users
  useEffect(() => {
    dispatch(
      fetchAllUsers({
        search: search || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        limit: pageSize,
        offset: page * pageSize,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      })
    );
  }, [dispatch, search, statusFilter, page]);

  // Handle search with debounce
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  // Handle export
  const handleExport = () => {
    const url = userApi.getExportUrl({
      status: statusFilter === 'all' ? undefined : statusFilter,
    });
    window.open(url, '_blank');
  };

  // Handle view user details
  const handleViewUser = (user: UserWithCounts) => {
    setSelectedUserId(user.id);
    dispatch(fetchUserById(user.id));
    setDetailDialogOpen(true);
  };

  // Handle close detail dialog
  const handleCloseDetail = () => {
    setDetailDialogOpen(false);
    setSelectedUserId(null);
    dispatch(clearSelectedUser());
  };

  // Handle open adjust wallet dialog
  const handleOpenAdjust = () => {
    setAdjustAmount('');
    setAdjustReason('');
    setAdjustDialogOpen(true);
  };

  // Handle adjust wallet submit
  const handleAdjustSubmit = async () => {
    if (!selectedUserId || !adjustAmount || !adjustReason.trim()) return;

    const amount = parseFloat(adjustAmount);
    if (isNaN(amount)) return;

    const result = await dispatch(adjustUserWallet({
      id: selectedUserId,
      amount,
      reason: adjustReason.trim(),
    }));

    if (adjustUserWallet.fulfilled.match(result)) {
      setAdjustDialogOpen(false);
      setAdjustSuccess(true);
      setTimeout(() => setAdjustSuccess(false), 3000);
      // Refresh user list
      dispatch(fetchAllUsers({
        search: search || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        limit: pageSize,
        offset: page * pageSize,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }));
    }
  };

  // Get status badge color
  const getStatusBadge = (status: UserStatus) => {
    if (status === 'CERTIFIED') {
      return 'bg-green-100 text-green-800';
    }
    return 'bg-yellow-100 text-yellow-800';
  };

  // Pagination info
  const totalPages = Math.ceil(total / pageSize);
  const startItem = page * pageSize + 1;
  const endItem = Math.min((page + 1) * pageSize, total);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">User Management</h3>
          <p className="text-sm text-gray-500">{total} users total</p>
        </div>

        <div className="flex items-center gap-3">
          <TextField
            placeholder="Search by email or name..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            size="small"
            sx={{ minWidth: 200 }}
          />
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as typeof statusFilter);
              setPage(0);
            }}
            size="small"
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="ACCUMULATION">Accumulation</MenuItem>
            <MenuItem value="CERTIFIED">Certified</MenuItem>
          </Select>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            sx={{ textTransform: 'none' }}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && <Alert severity="error">{error}</Alert>}

      {/* Success Alert */}
      {adjustSuccess && (
        <Alert severity="success" onClose={() => setAdjustSuccess(false)}>
          Wallet adjusted successfully.
        </Alert>
      )}

      {/* Loading State */}
      {loading && users.length === 0 && (
        <div className="flex justify-center py-12">
          <CircularProgress size={32} />
        </div>
      )}

      {/* User Table */}
      {(!loading || users.length > 0) && (
        <div className="bg-gray-50 rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Balance
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Impact
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Transactions
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Created
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-800">{user.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {user.firstName || user.lastName
                        ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800 text-right font-medium">
                      {formatEUR(user.walletBalance)}
                    </td>
                    <td className="px-4 py-3 text-sm text-green-600 text-right font-medium">
                      {formatWeightKg(user.walletImpactKg)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-center">
                      {user._count?.transactions || 0}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-md ${getStatusBadge(
                          user.status
                        )}`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        variant="text"
                        size="small"
                        onClick={() => handleViewUser(user)}
                        sx={{ textTransform: 'none', minWidth: 0 }}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && !loading && (
            <div className="p-8 text-center text-gray-500">
              No users found matching the criteria.
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {total > pageSize && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {startItem} to {endItem} of {total} users
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outlined"
              size="small"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              sx={{ textTransform: 'none' }}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {page + 1} of {totalPages}
            </span>
            <Button
              variant="outlined"
              size="small"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              sx={{ textTransform: 'none' }}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 rounded-md p-4 flex items-start gap-3">
        <svg
          className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div>
          <p className="text-sm font-medium text-blue-800">User Status</p>
          <p className="text-xs text-blue-600 mt-1">
            <strong>Accumulation:</strong> Users below the €10 threshold. Their contributions are
            tracked but not yet certified.
            <br />
            <strong>Certified:</strong> Users who have reached the €10 threshold and received a
            Certified Environmental Asset.
          </p>
        </div>
      </div>

      {/* User Detail Dialog */}
      <Dialog open={detailDialogOpen} onClose={handleCloseDetail} maxWidth="md" fullWidth>
        <DialogTitle>User Details</DialogTitle>
        <DialogContent>
          {loading && !selectedUser ? (
            <div className="flex justify-center py-8">
              <CircularProgress size={32} />
            </div>
          ) : selectedUser ? (
            <div className="space-y-6 pt-2">
              {/* User Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-800">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Name</p>
                  <p className="text-sm font-medium text-gray-800">
                    {selectedUser.firstName || selectedUser.lastName
                      ? `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim()
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Wallet Balance</p>
                  <p className="text-sm font-medium text-gray-800">{formatEUR(selectedUser.walletBalance)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Environmental Impact</p>
                  <p className="text-sm font-medium text-green-600">{formatWeightKg(selectedUser.walletImpactKg)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-md ${getStatusBadge(selectedUser.status)}`}>
                    {selectedUser.status}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Created</p>
                  <p className="text-sm text-gray-600">{formatDate(selectedUser.createdAt)}</p>
                </div>
              </div>

              {/* Address Info */}
              {(selectedUser.street || selectedUser.city || selectedUser.country) && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Address</p>
                  <p className="text-sm text-gray-600">
                    {[selectedUser.street, selectedUser.city, selectedUser.postalCode, selectedUser.state, selectedUser.country]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </div>
              )}

              {/* Recent Transactions */}
              {selectedUser.transactions && selectedUser.transactions.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Recent Transactions</p>
                  <div className="bg-gray-50 rounded-md divide-y divide-gray-200">
                    {selectedUser.transactions.slice(0, 5).map((tx) => (
                      <div key={tx.id} className="p-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-800">{tx.paymentMode}</p>
                          <p className="text-xs text-gray-500">{formatDate(tx.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-800">{formatEUR(tx.amount)}</p>
                          <p className="text-xs text-green-600">{formatWeightKg(tx.impactKg)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Wallet Adjustment Button */}
              <div className="pt-2">
                <Button
                  variant="outlined"
                  onClick={handleOpenAdjust}
                  sx={{ textTransform: 'none' }}
                >
                  Adjust Wallet
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetail} sx={{ textTransform: 'none' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Wallet Adjustment Dialog */}
      <Dialog open={adjustDialogOpen} onClose={() => setAdjustDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Adjust Wallet</DialogTitle>
        <DialogContent>
          <div className="space-y-4 pt-2">
            <Alert severity="warning">
              This will manually adjust the user&apos;s wallet balance. Use positive values to add, negative to subtract.
            </Alert>
            <TextField
              label="Amount (€)"
              type="number"
              value={adjustAmount}
              onChange={(e) => setAdjustAmount(e.target.value)}
              fullWidth
              placeholder="e.g., 5 or -2.50"
              helperText="Positive to add, negative to subtract"
            />
            <TextField
              label="Reason"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              fullWidth
              multiline
              rows={2}
              placeholder="Enter reason for adjustment (required)"
              required
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdjustDialogOpen(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAdjustSubmit}
            disabled={!adjustAmount || !adjustReason.trim() || loading}
            sx={{ textTransform: 'none' }}
          >
            {loading ? <CircularProgress size={20} /> : 'Apply Adjustment'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default UserManager;
