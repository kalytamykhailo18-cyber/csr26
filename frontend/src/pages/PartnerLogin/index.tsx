// CSR26 Partner Login Page
// Allows partners to request magic link for authentication

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { partnerApi, getPartnerToken } from '../../api/apiClient';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import LoadingSpinner from '../../components/LoadingSpinner';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';

const PartnerLogin = () => {
  const navigate = useNavigate();

  // Local state
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    const token = getPartnerToken();
    if (token) {
      navigate('/partner');
    }
  }, [navigate]);

  // Validate email format
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    setError('');

    // Validate email
    if (!email.trim()) {
      setEmailError('Email is required');
      return;
    }
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await partnerApi.sendMagicLink(email.trim());
      setMagicLinkSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send magic link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 pt-14">
      <Navigation />

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-md shadow-sm border border-gray-200 p-8 animate-fade-up-normal">
            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Partner Portal
              </h1>
              <p className="text-gray-600">
                Enter your email to access your partner dashboard.
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
                      Click the link in the email to access your partner dashboard.
                    </p>
                  </div>
                </Alert>
                <p className="text-center text-sm text-gray-500 mb-4">
                  The link will expire in 15 minutes.
                </p>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => setMagicLinkSent(false)}
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
                    label="Partner Email"
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
                    placeholder="partner@company.com"
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

            {/* Info */}
            <div className="mt-6 text-center text-sm text-gray-500">
              <p>
                This portal is for registered CSR26 distribution partners.
                Contact your administrator if you need access.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PartnerLogin;
