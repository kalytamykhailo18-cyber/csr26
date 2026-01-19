// CSR26 Login Page
// Allows returning users to request magic link for authentication
// DATA FLOW: Component → dispatch sendMagicLink → Redux → API → Response → UI

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { sendMagicLink, clearAuthError, resetMagicLinkStatus } from '../../store/slices/authSlice';
import { useNavigation } from '../../hooks/useNavigation';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import LoadingSpinner from '../../components/LoadingSpinner';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';

const Login = () => {
  const dispatch = useAppDispatch();
  const { goToLanding, goToDashboard } = useNavigation();

  // Local state
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  // Redux state
  const { isAuthenticated, loading, error, magicLinkSent } = useAppSelector(
    (state) => state.auth
  );

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      goToDashboard();
    }
  }, [isAuthenticated, goToDashboard]);

  // Clear errors and status on unmount
  useEffect(() => {
    return () => {
      dispatch(clearAuthError());
      dispatch(resetMagicLinkStatus());
    };
  }, [dispatch]);

  // Validate email format
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');

    // Validate email
    if (!email.trim()) {
      setEmailError('Email is required');
      return;
    }
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    // Dispatch sendMagicLink action
    dispatch(sendMagicLink(email.trim()));
  };

  // Handle go to landing
  const handleGoToLanding = () => {
    goToLanding();
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 pt-14">
      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-md shadow-sm border border-gray-200 p-8 animate-fade-up-normal">
            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Welcome Back
              </h1>
              <p className="text-gray-600">
                Enter your email to receive a secure login link.
              </p>
            </div>

            {/* Success Message - Magic Link Sent */}
            {magicLinkSent ? (
              <div className="animate-fade-up-fast">
                <Alert severity="success" className="mb-6">
                  <div>
                    <strong>Check your email!</strong>
                    <p className="mt-1 text-sm">
                      We've sent a login link to <strong>{email}</strong>.
                      Click the link in the email to access your dashboard.
                    </p>
                  </div>
                </Alert>
                <p className="text-center text-sm text-gray-500 mb-4">
                  The link will expire in 15 minutes.
                </p>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => dispatch(resetMagicLinkStatus())}
                  sx={{ textTransform: 'none' }}
                >
                  Send Another Link
                </Button>
              </div>
            ) : (
              /* Login Form */
              <form onSubmit={handleSubmit}>
                {/* Error Alert */}
                {error && (
                  <Alert severity="error" className="mb-4">
                    {error}
                  </Alert>
                )}

                {/* Email Field */}
                <div className="mb-6">
                  <TextField
                    fullWidth
                    label="Email Address"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError('');
                    }}
                    error={!!emailError}
                    helperText={emailError}
                    disabled={loading}
                    autoComplete="email"
                    autoFocus
                    placeholder="your@email.com"
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{
                    textTransform: 'none',
                    py: 1.5,
                    backgroundColor: '#1a1a2e',
                    '&:hover': {
                      backgroundColor: '#2d2d44',
                    },
                  }}
                >
                  {loading ? (
                    <LoadingSpinner size="small" />
                  ) : (
                    'Send Login Link'
                  )}
                </Button>
              </form>
            )}

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">
                  New to CSR26?
                </span>
              </div>
            </div>

            {/* Register CTA */}
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Start building your environmental portfolio today.
              </p>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleGoToLanding}
                sx={{ textTransform: 'none' }}
              >
                Get Started
              </Button>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>
              We use passwordless login for your security.
              A secure link will be sent to your email.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Login;
