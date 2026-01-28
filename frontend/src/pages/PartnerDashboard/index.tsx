// CSR26 Partner Dashboard
// Dashboard for partners to view their merchants, transactions, and impact
//
// ARCHITECTURE NOTE: This dashboard intentionally uses local state instead of Redux because:
// 1. Partners have a separate authentication system (PARTNER_TOKEN_KEY vs TOKEN_KEY)
// 2. Partner state is completely isolated from user state to prevent token conflicts
// 3. This avoids cross-contamination between partner and user sessions
// 4. The partnerApi uses a dedicated axios instance with partner-specific interceptors
// See apiClient.ts for the dual-auth implementation.

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { partnerApi, getPartnerToken, clearPartnerToken } from '../../api/apiClient';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import LoadingSpinner from '../../components/LoadingSpinner';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import DownloadIcon from '@mui/icons-material/Download';
import LogoutIcon from '@mui/icons-material/Logout';

interface PartnerDashboardData {
  partner: {
    id: string;
    name: string;
    email: string;
    contactPerson: string | null;
    commissionRate: number;
    active: boolean;
  };
  merchants: Array<{
    id: string;
    name: string;
    email: string;
    multiplier: number;
    currentBalance: number;
    transactionCount: number;
  }>;
  stats: {
    totalMerchants: number;
    totalTransactions: number;
    totalRevenue: number;
    totalImpactKg: number;
    monthlyTransactions: number;
    monthlyRevenue: number;
    monthlyImpactKg: number;
  };
}

interface Transaction {
  id: string;
  amount: number;
  impactKg: number;
  paymentMode: string;
  paymentStatus: string;
  createdAt: string;
  user: { email: string; firstName: string | null; lastName: string | null } | null;
  merchant: { name: string } | null;
  sku: { code: string; name: string } | null;
}

const PartnerDashboard = () => {
  const navigate = useNavigate();

  // State
  const [dashboard, setDashboard] = useState<PartnerDashboardData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'merchants' | 'transactions'>('overview');

  // Check auth and fetch data
  useEffect(() => {
    const token = getPartnerToken();
    if (!token) {
      navigate('/partner/login');
      return;
    }

    fetchDashboard();
    fetchTransactions();
  }, [navigate]);

  const fetchDashboard = async () => {
    try {
      const response = await partnerApi.getDashboard();
      if (response.data.success && response.data.data) {
        setDashboard(response.data.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      if (err instanceof Error && err.message.includes('401')) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await partnerApi.getTransactions({ limit: 50 });
      if (response.data.success && response.data.data) {
        setTransactions(response.data.data.transactions);
      }
    } catch (err) {
      console.error('Failed to load transactions:', err);
    }
  };

  const handleLogout = () => {
    clearPartnerToken();
    navigate('/partner/login');
  };

  // Export transactions to CSV
  const handleExportCSV = () => {
    if (transactions.length === 0) return;

    const headers = ['Date', 'Merchant', 'Customer Email', 'Amount', 'Impact (kg)', 'Status'];
    const rows = transactions.map((t) => [
      new Date(t.createdAt).toLocaleDateString(),
      t.merchant?.name || '-',
      t.user?.email || '-',
      t.amount.toFixed(2),
      t.impactKg.toFixed(2),
      t.paymentStatus,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `csr26-partner-transactions-${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 pt-14">
        <Navigation />
        <main className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="large" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 pt-14">
        <Navigation />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-md w-full">
            <Alert severity="error" className="mb-4">
              {error}
            </Alert>
            <Button
              fullWidth
              variant="contained"
              onClick={() => navigate('/partner/login')}
              sx={{ textTransform: 'none' }}
            >
              Go to Login
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 pt-14">
      <Navigation />

      <main className="flex-1 px-4 md:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 animate-fade-down-fast">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">
                Partner Dashboard
              </h1>
              <p className="text-gray-600">
                Welcome, {dashboard?.partner.name}
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <Button
                variant="outlined"
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
                sx={{ textTransform: 'none' }}
              >
                Logout
              </Button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            {(['overview', 'merchants', 'transactions'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && dashboard && (
            <div className="space-y-6 animate-fade-up-fast">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-md border border-gray-200 p-4">
                  <p className="text-sm text-gray-500 mb-1">Total Merchants</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {dashboard.stats.totalMerchants}
                  </p>
                </div>
                <div className="bg-white rounded-md border border-gray-200 p-4">
                  <p className="text-sm text-gray-500 mb-1">Total Transactions</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {dashboard.stats.totalTransactions}
                  </p>
                </div>
                <div className="bg-white rounded-md border border-gray-200 p-4">
                  <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    {dashboard.stats.totalRevenue.toFixed(2)}
                  </p>
                </div>
                <div className="bg-white rounded-md border border-gray-200 p-4">
                  <p className="text-sm text-gray-500 mb-1">Total Impact</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {dashboard.stats.totalImpactKg.toFixed(2)} kg
                  </p>
                </div>
              </div>

              {/* Monthly Stats */}
              <div className="bg-white rounded-md border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">This Month</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Transactions</p>
                    <p className="text-xl font-semibold">{dashboard.stats.monthlyTransactions}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Revenue</p>
                    <p className="text-xl font-semibold text-green-600">
                      {dashboard.stats.monthlyRevenue.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Impact</p>
                    <p className="text-xl font-semibold text-blue-600">
                      {dashboard.stats.monthlyImpactKg.toFixed(2)} kg
                    </p>
                  </div>
                </div>
              </div>

              {/* Partner Info */}
              <div className="bg-white rounded-md border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Partner Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{dashboard.partner.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Contact Person</p>
                    <p className="font-medium">{dashboard.partner.contactPerson || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Commission Rate</p>
                    <p className="font-medium">{dashboard.partner.commissionRate}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                      dashboard.partner.active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {dashboard.partner.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Merchants Tab */}
          {activeTab === 'merchants' && dashboard && (
            <div className="animate-fade-up-fast">
              <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
                <TableContainer component={Paper} elevation={0}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Merchant</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell align="right">Multiplier</TableCell>
                        <TableCell align="right">Transactions</TableCell>
                        <TableCell align="right">Balance</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dashboard.merchants.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center" className="py-8">
                            <p className="text-gray-500">No merchants found</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        dashboard.merchants.map((merchant) => (
                          <TableRow key={merchant.id} hover>
                            <TableCell className="font-medium">{merchant.name}</TableCell>
                            <TableCell>{merchant.email}</TableCell>
                            <TableCell align="right">{merchant.multiplier}x</TableCell>
                            <TableCell align="right">{merchant.transactionCount}</TableCell>
                            <TableCell align="right">{merchant.currentBalance.toFixed(2)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </div>
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div className="animate-fade-up-fast">
              <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Transaction History</h3>
                    <p className="text-sm text-gray-500">{transactions.length} transactions</p>
                  </div>
                  <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={handleExportCSV}
                    disabled={transactions.length === 0}
                    size="small"
                    sx={{ textTransform: 'none' }}
                  >
                    Export CSV
                  </Button>
                </div>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Merchant</TableCell>
                        <TableCell>Customer</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell align="right">Impact (kg)</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {transactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center" className="py-8">
                            <p className="text-gray-500">No transactions found</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        transactions.map((t) => (
                          <TableRow key={t.id} hover>
                            <TableCell>{new Date(t.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell>{t.merchant?.name || '-'}</TableCell>
                            <TableCell>{t.user?.email || '-'}</TableCell>
                            <TableCell align="right">{Number(t.amount).toFixed(2)}</TableCell>
                            <TableCell align="right">{Number(t.impactKg).toFixed(2)}</TableCell>
                            <TableCell>
                              <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                                t.paymentStatus === 'COMPLETED'
                                  ? 'bg-green-100 text-green-800'
                                  : t.paymentStatus === 'PENDING'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {t.paymentStatus}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PartnerDashboard;
