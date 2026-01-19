// CSR26 Merchant Dashboard
// Dashboard for merchants to view transactions, billing, and impact
// DATA FLOW: Component mount → dispatch fetchMerchant → Redux → API → Response → UI

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchMerchantById,
  fetchMerchantTransactions,
  fetchMerchantBilling,
  fetchAllMerchants,
} from '../../store/slices/merchantSlice';
import type { TransactionWithRelations } from '../../types';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import LoadingSpinner from '../../components/LoadingSpinner';
import SummaryCards from './SummaryCards';
import TransactionTable from './TransactionTable';
import BillingSection from './BillingSection';
import QRCodeSection from './QRCodeSection';
import SettingsSection from './SettingsSection';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import DownloadIcon from '@mui/icons-material/Download';
import { useNavigation } from '../../hooks/useNavigation';

const MerchantDashboard = () => {
  const dispatch = useAppDispatch();
  const { id } = useParams<{ id: string }>();
  const { goToMerchantDashboard } = useNavigation();

  // Redux state
  const { user } = useAppSelector((state) => state.auth);
  const {
    currentMerchant,
    merchants,
    transactions,
    billing,
    loading,
    error,
  } = useAppSelector((state) => state.merchant);

  // Local state for filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Check if user is admin
  const isAdmin = user?.role === 'ADMIN';

  // For admin without ID in URL, we need to show merchant selection
  // For merchant users, use their user ID (which should match their merchant record)
  const merchantId = id || (isAdmin ? undefined : user?.id);

  // Fetch merchant data on mount
  useEffect(() => {
    if (merchantId) {
      dispatch(fetchMerchantById(merchantId));
      dispatch(fetchMerchantTransactions({ id: merchantId }));
      dispatch(fetchMerchantBilling(merchantId));
    } else if (isAdmin) {
      // Admin without merchant ID - fetch all merchants for selection
      dispatch(fetchAllMerchants());
    }
  }, [dispatch, merchantId, isAdmin]);

  // Handle date filter - backend now supports dateFrom/dateTo
  const handleFilter = () => {
    if (merchantId) {
      dispatch(fetchMerchantTransactions({
        id: merchantId,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      }));
    }
  };

  // Clear date filters
  const handleClearFilters = () => {
    setDateFrom('');
    setDateTo('');
    if (merchantId) {
      dispatch(fetchMerchantTransactions({ id: merchantId }));
    }
  };

  // Handle CSV export
  const handleExportCSV = () => {
    if (!transactions || transactions.length === 0) return;

    const headers = ['Date', 'Customer Email', 'Amount (€)', 'Impact (kg)', 'Status'];
    const rows = transactions.map((t: TransactionWithRelations) => [
      new Date(t.createdAt).toLocaleDateString(),
      t.user?.email || '-',
      t.amount.toFixed(2),
      t.impactKg.toFixed(2),
      t.paymentStatus,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r: string[]) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `csr26-transactions-${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate summary data
  const totalImpactKg = transactions?.reduce((sum: number, t: TransactionWithRelations) => sum + t.impactKg, 0) || 0;
  const totalAmount = transactions?.reduce((sum: number, t: TransactionWithRelations) => sum + t.amount, 0) || 0;
  const customerCount = new Set(transactions?.map((t: TransactionWithRelations) => t.userId) || []).size;

  // Admin without merchant ID - show merchant selection
  if (isAdmin && !merchantId) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 pt-14">
        <Navigation />
        <main className="flex-1 px-4 md:px-8 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8 animate-fade-down-fast">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                Select Merchant
              </h2>
              <p className="text-gray-600">
                Choose a merchant to view their dashboard.
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="large" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-up-fast">
                {merchants.map((merchant) => (
                  <button
                    key={merchant.id}
                    onClick={() => goToMerchantDashboard(merchant.id)}
                    className="bg-white rounded-md border border-gray-200 p-6 text-left hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">
                      {merchant.name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-3">{merchant.email}</p>
                    <div className="flex gap-4 text-sm">
                      <span className="text-blue-600">
                        {merchant.multiplier}x multiplier
                      </span>
                      <span className="text-gray-400">|</span>
                      <span className="text-green-600">
                        {merchant._count?.transactions || 0} transactions
                      </span>
                    </div>
                  </button>
                ))}
                {merchants.length === 0 && (
                  <p className="text-gray-500 col-span-2 text-center py-8">
                    No merchants found. Create one in the Admin panel.
                  </p>
                )}
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 pt-14">
      {/* Global Navigation */}
      <Navigation />

      {/* Main Content */}
      <main className="flex-1 px-4 md:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Page Title */}
          <div className="mb-8 animate-fade-down-fast">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
              {currentMerchant?.name ? `${currentMerchant.name} - ` : ''}Environmental Impact Overview
            </h2>
            <p className="text-gray-600">
              Track your business&apos;s contribution to certified plastic removal.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" className="mb-6">
              {error}
            </Alert>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="large" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="animate-fade-right-normal">
                <SummaryCards
                  totalImpactKg={totalImpactKg}
                  totalAmount={totalAmount}
                  transactionCount={transactions?.length || 0}
                  customerCount={customerCount}
                  multiplier={currentMerchant?.multiplier || 1}
                />
              </div>

              {/* Settings Section */}
              <div className="animate-fade-left-normal">
                <SettingsSection
                  currentMultiplier={currentMerchant?.multiplier || 1}
                  merchantId={merchantId || ''}
                  onRequestChange={(newMultiplier) => {
                    // In production, this would dispatch an action to update multiplier
                    console.log('Multiplier change requested:', newMultiplier);
                  }}
                />
              </div>

              {/* QR Code Section */}
              <div className="animate-fade-right-light-slow">
                <QRCodeSection
                  merchantId={merchantId || ''}
                  merchantName={currentMerchant?.name}
                />
              </div>

              {/* Billing Section */}
              {billing && (
                <div className="animate-fade-left-light-slow">
                  <BillingSection billing={billing} />
                </div>
              )}

              {/* Transaction Table */}
              <div className="bg-white rounded-md border border-gray-200 overflow-hidden animate-fade-up-light-slow">
                {/* Table Header with Filters */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        Transaction History
                      </h3>
                      <p className="text-sm text-gray-500">
                        {transactions?.length || 0} transactions
                      </p>
                    </div>

                    {/* Filters and Export */}
                    <div className="flex flex-col md:flex-row gap-3">
                      <TextField
                        type="date"
                        label="From"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        size="small"
                        slotProps={{
                          inputLabel: { shrink: true },
                        }}
                      />
                      <TextField
                        type="date"
                        label="To"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        size="small"
                        slotProps={{
                          inputLabel: { shrink: true },
                        }}
                      />
                      <Button
                        variant="outlined"
                        onClick={handleFilter}
                        size="small"
                        sx={{ textTransform: 'none' }}
                      >
                        Filter
                      </Button>
                      {(dateFrom || dateTo) && (
                        <Button
                          variant="text"
                          onClick={handleClearFilters}
                          size="small"
                          sx={{ textTransform: 'none' }}
                        >
                          Clear
                        </Button>
                      )}
                      <Button
                        variant="contained"
                        onClick={handleExportCSV}
                        startIcon={<DownloadIcon />}
                        size="small"
                        sx={{ textTransform: 'none' }}
                        disabled={!transactions || transactions.length === 0}
                      >
                        Export CSV
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Transaction Table */}
                <TransactionTable transactions={transactions || []} />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default MerchantDashboard;
