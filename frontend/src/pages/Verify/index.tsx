// CSR26 Magic Link Verification Page
// Processes magic link token and redirects to dashboard on success
// DATA FLOW: Page mount → dispatch verifyMagicLink → Redux → API → Response → Redirect

import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { verifyMagicLink, clearAuthError } from '../../store/slices/authSlice';
import { useNavigation } from '../../hooks/useNavigation';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import LoadingSpinner from '../../components/LoadingSpinner';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';

const Verify = () => {
  const dispatch = useAppDispatch();
  const { token } = useParams<{ token: string }>();
  const { goToLogin, goToDashboard, goToLanding } = useNavigation();

  // Redux state
  const { isAuthenticated, loading, error } = useAppSelector((state) => state.auth);

  // Verify token on mount
  useEffect(() => {
    if (token) {
      dispatch(verifyMagicLink(token));
    }
  }, [dispatch, token]);

  // Redirect to dashboard on successful verification
  useEffect(() => {
    if (isAuthenticated) {
      // Small delay for UX - show success briefly
      const timer = setTimeout(() => {
        goToDashboard();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, goToDashboard]);

  // Clear errors on unmount
  useEffect(() => {
    return () => {
      dispatch(clearAuthError());
    };
  }, [dispatch]);

  // Handle try again - go to login
  const handleTryAgain = () => {
    goToLogin();
  };

  // Handle go to landing
  const handleGoToLanding = () => {
    goToLanding();
  };

  // No token provided
  if (!token) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 pt-14">
        <Navigation />

        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-md text-center">
            <Alert severity="error" className="mb-6">
              Invalid verification link. No token provided.
            </Alert>
            <Button
              variant="contained"
              onClick={handleTryAgain}
              sx={{
                textTransform: 'none',
                backgroundColor: '#1a1a2e',
                '&:hover': { backgroundColor: '#2d2d44' },
              }}
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
      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-md shadow-sm border border-gray-200 p-8 text-center">
            {/* Loading State */}
            {loading && (
              <div className="animate-fade-up-fast">
                <LoadingSpinner size="large" />
                <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">
                  Verifying your link...
                </h2>
                <p className="text-gray-600">
                  Please wait while we authenticate you.
                </p>
              </div>
            )}

            {/* Success State */}
            {isAuthenticated && !loading && (
              <div className="animate-fade-up-fast">
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
                <h2 className="text-xl font-semibold text-green-800 mb-2">
                  Successfully Verified!
                </h2>
                <p className="text-gray-600 mb-4">
                  Redirecting you to your dashboard...
                </p>
                <LoadingSpinner size="small" />
              </div>
            )}

            {/* Error State */}
            {error && !loading && !isAuthenticated && (
              <div className="animate-fade-up-fast">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                  <svg
                    className="w-8 h-8 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-red-800 mb-2">
                  Verification Failed
                </h2>
                <Alert severity="error" className="mb-6 text-left">
                  {error === 'Magic link expired' ? (
                    <div>
                      <strong>This link has expired.</strong>
                      <p className="mt-1 text-sm">
                        Magic links are valid for 15 minutes. Please request a new one.
                      </p>
                    </div>
                  ) : error === 'Magic link already used' ? (
                    <div>
                      <strong>This link has already been used.</strong>
                      <p className="mt-1 text-sm">
                        Each login link can only be used once. Please request a new one.
                      </p>
                    </div>
                  ) : (
                    error
                  )}
                </Alert>
                <div className="space-y-3">
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleTryAgain}
                    sx={{
                      textTransform: 'none',
                      backgroundColor: '#1a1a2e',
                      '&:hover': { backgroundColor: '#2d2d44' },
                    }}
                  >
                    Request New Link
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={handleGoToLanding}
                    sx={{ textTransform: 'none' }}
                  >
                    Go to Home
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Verify;
