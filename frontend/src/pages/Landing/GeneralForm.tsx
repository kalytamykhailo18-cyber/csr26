// CSR26 General Form Component
// For Case F: GENERAL mode (marketing/direct landing, no SKU)
// RULE: Shows general message, customer chooses amount
// RULE: Use HTML + Tailwind for layout, MUI only for interactive components
// DATA FLOW: Form input → Validate → Create Payment Intent → Stripe Payment → Confirm → Update wallet

import { useState, useEffect } from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Alert from '@mui/material/Alert';
import MenuItem from '@mui/material/MenuItem';
import PublicIcon from '@mui/icons-material/Public';
import type { LandingFormData } from '../../types';
import { COUNTRIES } from '../../types';
import StripePaymentForm from '../../components/StripePaymentForm';
import { formatEUR } from '../../utils/formatters';

// Predefined amount options
const AMOUNT_OPTIONS = [
  { value: 1, label: '€1', description: '~9 kg plastic' },
  { value: 5, label: '€5', description: '~45 kg plastic' },
  { value: 10, label: '€10', description: '~91 kg plastic' },
  { value: 25, label: '€25', description: '~227 kg plastic' },
  { value: 0, label: 'Custom', description: '' },
];

interface GeneralFormProps {
  formType: 'minimal' | 'standard' | 'full';
  message: {
    title: string;
    message: string;
  };
  impact: {
    displayValue: string;
    impactKg: number;
  };
  amount: number;
  onAmountChange: (amount: number) => void;
  onSubmit: (data: LandingFormData) => Promise<void>;
  loading: boolean;
  error: string | null;
}

const GeneralForm = ({
  formType,
  message: _message,
  impact,
  amount,
  onAmountChange,
  onSubmit,
  loading,
  error,
}: GeneralFormProps) => {
  const [formData, setFormData] = useState<LandingFormData>({
    email: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    street: '',
    city: '',
    postalCode: '',
    country: '',
    state: '',
    termsAccepted: false,
    amount: amount,
  });

  const [customAmount, setCustomAmount] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => {
    setFormData((prev) => ({ ...prev, amount }));
  }, [amount]);

  const handleChange = (field: keyof LandingFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleAmountSelect = (value: number) => {
    if (value === 0) {
      setShowCustomInput(true);
    } else {
      setShowCustomInput(false);
      setCustomAmount('');
      onAmountChange(value);
    }
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomAmount(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 1) {
      onAmountChange(numValue);
    }
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (amount < 1) {
      errors.amount = 'Minimum contribution is €1';
    }

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }

    if (formType === 'standard' || formType === 'full') {
      if (!formData.firstName) errors.firstName = 'First name is required';
      if (!formData.lastName) errors.lastName = 'Last name is required';
      if (!formData.termsAccepted) errors.termsAccepted = 'You must accept the terms';
    }

    if (formType === 'full') {
      if (!formData.dateOfBirth) errors.dateOfBirth = 'Date of birth is required';
      if (!formData.street) errors.street = 'Street is required';
      if (!formData.city) errors.city = 'City is required';
      if (!formData.postalCode) errors.postalCode = 'Postal code is required';
      if (!formData.country) errors.country = 'Country is required';
      if (!formData.state) errors.state = 'State/Province is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Step 1: Validate form and proceed to payment
  const handleProceedToPayment = () => {
    if (validate()) {
      setPaymentError(null);
      setShowPaymentForm(true);
    }
  };

  // Step 2: Payment successful - transaction already created by createPaymentIntent
  // Just show success, don't create another transaction
  const handlePaymentSuccess = async (_transactionId: string) => {
    try {
      // Transaction was already created by createPaymentIntent and confirmed by confirmPayment
      // Just register/update user data and show success
      await onSubmit({ ...formData, amount });
    } catch (err) {
      // Even if onSubmit fails, payment was successful
      console.warn('Post-payment user update failed:', err);
      setPaymentError(err instanceof Error ? err.message : 'Failed to complete transaction');
    }
  };

  // Handle payment error
  const handlePaymentError = (errorMsg: string) => {
    setPaymentError(errorMsg);
  };

  // Go back from payment form
  const handleBackToForm = () => {
    setShowPaymentForm(false);
    setPaymentError(null);
  };

  // If showing payment form
  if (showPaymentForm) {
    return (
      <div className="bg-white rounded-md border border-gray-200 p-6 md:p-8">
        {/* Payment Summary */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Summary</h3>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Environmental Allocation</span>
            <span className="font-semibold">{formatEUR(amount)}</span>
          </div>
          <div className="flex justify-between items-center text-green-600">
            <span>Impact</span>
            <span className="font-semibold">{impact.displayValue} plastic removed</span>
          </div>
        </div>

        {/* Payment Error */}
        {paymentError && (
          <Alert severity="error" className="mb-4">
            {paymentError}
          </Alert>
        )}

        {/* Stripe Payment Form */}
        <StripePaymentForm
          amount={amount}
          email={formData.email}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          onCancel={handleBackToForm}
        />

        {/* Back Button */}
        <div className="mt-4">
          <Button
            onClick={handleBackToForm}
            variant="text"
            fullWidth
            sx={{ textTransform: 'none' }}
          >
            ← Back to Form
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-md border border-gray-200 p-6 md:p-8">
      {/* Introduction Section */}
      <div className="text-center mb-8 animate-fade-down-fast">
        <div className="flex justify-center mb-4">
          <div className="bg-blue-100 rounded-full p-4">
            <PublicIcon sx={{ fontSize: 48, color: 'primary.main' }} />
          </div>
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          Build Your Environmental Portfolio
        </h3>
        <p className="text-gray-600 text-sm">
          Participate in certified plastic removal and transform your impact into a real, tracked, and guaranteed value.
        </p>
      </div>

      {/* Amount Selection Grid */}
      <div className="mb-6 animate-fade-right-normal">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Choose Your Contribution
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {AMOUNT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleAmountSelect(option.value)}
              className={`py-4 px-3 rounded-md border text-center transition-all ${
                (amount === option.value && !showCustomInput) ||
                (option.value === 0 && showCustomInput)
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:shadow-sm'
              }`}
              disabled={loading}
            >
              <span className="block text-lg font-semibold">{option.label}</span>
              {option.description && (
                <span className={`block text-xs mt-1 ${
                  amount === option.value && !showCustomInput ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {option.description}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Custom Amount Input */}
        {showCustomInput && (
          <div className="mt-4 animate-fade-up-fast">
            <TextField
              fullWidth
              label="Custom Amount (€)"
              type="number"
              value={customAmount}
              onChange={handleCustomAmountChange}
              error={!!validationErrors.amount}
              helperText={validationErrors.amount || 'Minimum €1'}
              disabled={loading}
              slotProps={{
                htmlInput: { min: 1, step: 0.01 },
              }}
            />
          </div>
        )}
      </div>

      {/* Impact Preview */}
      {amount > 0 && (
        <div className="text-center mb-6 bg-green-50 rounded-md py-4 animate-zoom-in-fast">
          <p className="text-sm text-gray-500 mb-1">Your Environmental Impact</p>
          <p className="text-3xl font-bold text-green-600">{impact.displayValue}</p>
          <p className="text-sm text-gray-500">of plastic removed</p>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" className="mb-4">
          {error}
        </Alert>
      )}

      <div className="space-y-4">
        {/* Email */}
        <div className="animate-fade-right-fast">
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={formData.email}
            onChange={handleChange('email')}
            error={!!validationErrors.email}
            helperText={validationErrors.email}
            disabled={loading}
            required
          />
        </div>

        {/* Standard Form Fields */}
        {(formType === 'standard' || formType === 'full') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-right-normal">
            <TextField
              fullWidth
              label="First Name"
              value={formData.firstName}
              onChange={handleChange('firstName')}
              error={!!validationErrors.firstName}
              helperText={validationErrors.firstName}
              disabled={loading}
              required
            />
            <TextField
              fullWidth
              label="Last Name"
              value={formData.lastName}
              onChange={handleChange('lastName')}
              error={!!validationErrors.lastName}
              helperText={validationErrors.lastName}
              disabled={loading}
              required
            />
          </div>
        )}

        {/* Full Form Fields */}
        {formType === 'full' && (
          <>
            <div className="animate-fade-right-light-slow">
              <TextField
                fullWidth
                label="Date of Birth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange('dateOfBirth')}
                error={!!validationErrors.dateOfBirth}
                helperText={validationErrors.dateOfBirth}
                disabled={loading}
                required
                slotProps={{
                  inputLabel: { shrink: true },
                }}
              />
            </div>

            <div className="animate-fade-left-fast">
              <TextField
                fullWidth
                label="Street and House Number"
                value={formData.street}
                onChange={handleChange('street')}
                error={!!validationErrors.street}
                helperText={validationErrors.street}
                disabled={loading}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-left-normal">
              <TextField
                fullWidth
                label="City"
                value={formData.city}
                onChange={handleChange('city')}
                error={!!validationErrors.city}
                helperText={validationErrors.city}
                disabled={loading}
                required
              />
              <TextField
                fullWidth
                label="Postal Code"
                value={formData.postalCode}
                onChange={handleChange('postalCode')}
                error={!!validationErrors.postalCode}
                helperText={validationErrors.postalCode}
                disabled={loading}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-left-light-slow">
              <TextField
                fullWidth
                select
                label="Country"
                value={formData.country}
                onChange={handleChange('country')}
                error={!!validationErrors.country}
                helperText={validationErrors.country}
                disabled={loading}
                required
              >
                {COUNTRIES.map((country) => (
                  <MenuItem key={country.code} value={country.code}>
                    {country.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                label="State/Province"
                value={formData.state}
                onChange={handleChange('state')}
                error={!!validationErrors.state}
                helperText={validationErrors.state}
                disabled={loading}
                required
              />
            </div>
          </>
        )}

        {/* Terms Checkbox */}
        {(formType === 'standard' || formType === 'full') && (
          <div className="animate-fade-up-fast">
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.termsAccepted}
                  onChange={handleChange('termsAccepted')}
                  disabled={loading}
                />
              }
              label={
                <span className="text-sm text-gray-600">
                  I accept the Terms of Service and confirm that I have read the Privacy Policy.
                </span>
              }
            />
            {validationErrors.termsAccepted && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.termsAccepted}</p>
            )}
          </div>
        )}

        {/* Proceed to Payment Button */}
        <div className="pt-4 animate-fade-up-normal">
          <Button
            onClick={handleProceedToPayment}
            variant="contained"
            fullWidth
            size="large"
            disabled={loading || amount < 1}
            sx={{
              py: 1.5,
              textTransform: 'none',
              fontSize: '1rem',
            }}
          >
            {loading ? 'Processing...' : `Continue to Payment - ${formatEUR(amount)}`}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GeneralForm;
