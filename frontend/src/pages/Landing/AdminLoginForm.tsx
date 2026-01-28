// CSR26 Admin Login Form
// Handles admin access via special SKU code with secret validation
// Requirements: Admin accesses via landing?sku=ADMIN-ACCESS-2026 with secret code

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { adminLogin } from '../../store/slices/authSlice';
import LoadingSpinner from '../../components/LoadingSpinner';

interface AdminLoginFormProps {
  skuCode: string;
}

const AdminLoginForm = ({ skuCode }: AdminLoginFormProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error } = useAppSelector((state) => state.auth);

  const [secretCode, setSecretCode] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLocalError(null);

    if (!secretCode.trim()) {
      setLocalError('Secret code is required');
      return;
    }

    const result = await dispatch(adminLogin(secretCode));

    if (adminLogin.fulfilled.match(result)) {
      // Successfully logged in as admin, redirect to admin panel
      navigate('/admin');
    } else {
      setLocalError(result.payload as string || 'Invalid secret code');
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-md shadow-lg p-8 border border-gray-100">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Admin Access</h2>
          <p className="text-gray-600 mt-2">
            Enter your secret code to access the admin panel
          </p>
          <p className="text-xs text-gray-400 mt-1">
            SKU: {skuCode}
          </p>
        </div>

        {/* Form Content */}
        <div className="space-y-6">
          {/* Secret Code Input */}
          <div>
            <label
              htmlFor="secretCode"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Secret Code
            </label>
            <input
              id="secretCode"
              type="password"
              value={secretCode}
              onChange={(e) => setSecretCode(e.target.value)}
              placeholder="Enter your secret code"
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              autoComplete="off"
              autoFocus
            />
          </div>

          {/* Error Message */}
          {(localError || error) && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{localError || error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !secretCode.trim()}
            className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {loading ? (
              <>
                <LoadingSpinner size="small" />
                <span className="ml-2">Verifying...</span>
              </>
            ) : (
              'Access Admin Panel'
            )}
          </button>
        </div>

        {/* Security Note */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center">
            This is a secure admin access point. Unauthorized access attempts are logged.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginForm;
