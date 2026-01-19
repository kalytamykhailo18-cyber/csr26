// CSR26 User Dashboard
// Main dashboard showing wallet, progress, and transaction history
// DATA FLOW: Component mount → dispatch fetchWallet → Redux → API → Response → UI

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchWallet } from '../../store/slices/walletSlice';
import { fetchTransactions } from '../../store/slices/transactionSlice';
import { useNavigation } from '../../hooks/useNavigation';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import LoadingSpinner from '../../components/LoadingSpinner';
import WalletCard from './WalletCard';
import ProgressBar from './ProgressBar';
import TransactionList from './TransactionList';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import { formatWeightKg } from '../../utils/formatters';

const Dashboard = () => {
  const dispatch = useAppDispatch();
  const { goToLanding } = useNavigation();

  // Redux state
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { wallet, loading: walletLoading, error: walletError } = useAppSelector(
    (state) => state.wallet
  );
  const {
    transactions,
    loading: transactionsLoading,
    error: transactionsError,
  } = useAppSelector((state) => state.transaction);
  const { certificationThreshold, loading: settingsLoading } = useAppSelector((state) => state.settings);

  // Fetch wallet and transactions on mount
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchWallet());
      dispatch(fetchTransactions({}));
    }
  }, [dispatch, isAuthenticated]);

  const isLoading = walletLoading || transactionsLoading || settingsLoading;
  const error = walletError || transactionsError;

  // Calculate threshold progress (prevent division by zero)
  const effectiveThreshold = certificationThreshold > 0 ? certificationThreshold : 10;
  const thresholdProgress = wallet && wallet.balance > 0
    ? Math.min((wallet.balance / effectiveThreshold) * 100, 100)
    : 0;
  const isCertified = wallet ? wallet.balance >= effectiveThreshold : false;

  const handleContributeMore = () => {
    goToLanding();
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 pt-14">
      {/* Global Navigation */}
      <Navigation />

      {/* Main Content */}
      <main className="flex-1 px-4 md:px-8 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Welcome Section - Personalized Greeting */}
          <div className="mb-8 animate-fade-down-fast">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
              Welcome{user?.firstName ? `, ${user.firstName}` : ''}!
            </h2>
            <p className="text-gray-600">
              Track your environmental impact and watch your certified assets grow.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" className="mb-6">
              {error}
            </Alert>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="large" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Wallet Card */}
              <div className="animate-fade-right-normal">
                <WalletCard
                  balance={wallet?.balance || 0}
                  impactKg={wallet?.impactKg || 0}
                  status={wallet?.status || 'ACCUMULATION'}
                  transactionCount={wallet?.transactionCount || 0}
                />
              </div>

              {/* Progress Bar (only show if not certified) */}
              {!isCertified && (
                <div className="animate-fade-left-normal">
                  <ProgressBar
                    progress={thresholdProgress}
                    currentAmount={wallet?.balance || 0}
                    threshold={effectiveThreshold}
                  />
                </div>
              )}

              {/* Certified Section (show if certified) */}
              {isCertified && (
                <div className="bg-green-50 border border-green-200 rounded-md p-6 animate-zoom-in-normal">
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                      <svg
                        className="w-8 h-8 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-green-800 mb-2">
                      Certified Environmental Asset
                    </h3>
                    <p className="text-green-700">
                      You own <strong>{formatWeightKg(wallet?.impactKg || 0)}</strong> of certified environmental assets.
                    </p>
                  </div>

                  {/* Certificate Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    {/* Download Certificate Button */}
                    <Button
                      variant="contained"
                      color="success"
                      onClick={() => {
                        // Certificate download - requires backend implementation
                        window.alert('Certificate download will be available soon. Your certified assets are securely recorded in the CPRS protocol.');
                      }}
                      sx={{
                        textTransform: 'none',
                        px: 3,
                      }}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download Certificate
                    </Button>

                    {/* Corsair Connect Link */}
                    <Button
                      variant="outlined"
                      color="success"
                      onClick={() => {
                        // Corsair Connect account link - external service
                        window.open('https://corsairconnect.com/account', '_blank', 'noopener,noreferrer');
                      }}
                      sx={{
                        textTransform: 'none',
                        px: 3,
                      }}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Corsair Connect Account
                    </Button>
                  </div>
                </div>
              )}

              {/* Transaction History */}
              <div className="animate-fade-up-light-slow">
                <TransactionList transactions={transactions} />
              </div>

              {/* Call to Action */}
              <div className="text-center pt-4 animate-fade-up-slow">
                <Button
                  variant="outlined"
                  size="large"
                  onClick={handleContributeMore}
                  sx={{
                    textTransform: 'none',
                    px: 4,
                  }}
                >
                  Contribute More
                </Button>
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

export default Dashboard;
