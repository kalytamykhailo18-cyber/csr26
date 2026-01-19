// CSR26 Claim Form Component
// For Cases A and B: CLAIM mode (merchant prepaid/funded)
// RULE: Minimal form (email) for below threshold, full form for €10+
// RULE: Use HTML + Tailwind for layout, MUI only for interactive components

import { useState } from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Alert from '@mui/material/Alert';
import type { LandingFormData } from '../../types';
import { COUNTRIES } from '../../types';
import MenuItem from '@mui/material/MenuItem';

interface ClaimFormProps {
  formType: 'minimal' | 'standard' | 'full';
  message: {
    title: string;
    message: string;
  };
  impact: {
    displayValue: string;
    impactKg: number;
  };
  onSubmit: (data: LandingFormData) => Promise<void>;
  loading: boolean;
  error: string | null;
}

const ClaimForm = ({
  formType,
  message: _message, // Passed for API consistency, display handled by parent
  impact,
  onSubmit,
  loading,
  error,
}: ClaimFormProps) => {
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
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof LandingFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear validation error when field changes
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    // Email always required
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }

    // Full form validation
    if (formType === 'full') {
      if (!formData.firstName) errors.firstName = 'First name is required';
      if (!formData.lastName) errors.lastName = 'Last name is required';
      if (!formData.dateOfBirth) errors.dateOfBirth = 'Date of birth is required';
      if (!formData.street) errors.street = 'Street is required';
      if (!formData.city) errors.city = 'City is required';
      if (!formData.postalCode) errors.postalCode = 'Postal code is required';
      if (!formData.country) errors.country = 'Country is required';
      if (!formData.state) errors.state = 'State/Province is required';
      if (!formData.termsAccepted) errors.termsAccepted = 'You must accept the terms';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (validate()) {
      await onSubmit(formData);
    }
  };

  return (
    <div className="bg-white rounded-md border border-gray-200 p-6 md:p-8">
      {/* Impact Display */}
      <div className="text-center mb-6 animate-fade-down-fast">
        <p className="text-sm text-gray-500 mb-1">Environmental Impact</p>
        <p className="text-3xl font-bold text-green-600">{impact.displayValue}</p>
        <p className="text-sm text-gray-500">of plastic removed</p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" className="mb-4">
          {error}
        </Alert>
      )}

      <div className="space-y-4">
        {/* Email - Always shown */}
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

        {/* Full Form Fields - Only for €10+ */}
        {formType === 'full' && (
          <>
            {/* Name Fields */}
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

            {/* Date of Birth */}
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

            {/* Street */}
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

            {/* City and Postal Code */}
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

            {/* Country and State */}
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

            {/* Terms Checkbox */}
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
          </>
        )}

        {/* Submit Button */}
        <div className="pt-4 animate-fade-up-normal">
          <Button
            onClick={handleSubmit}
            variant="contained"
            fullWidth
            size="large"
            disabled={loading}
            sx={{
              py: 1.5,
              textTransform: 'none',
              fontSize: '1rem',
            }}
          >
            {loading ? 'Processing...' : 'Claim Your Impact'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ClaimForm;
