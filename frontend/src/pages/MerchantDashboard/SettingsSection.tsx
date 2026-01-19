// CSR26 Merchant Settings Section Component
// Allows merchants to view and request multiplier changes
// RULE: Use HTML + Tailwind for layout, MUI only for interactive components

import { useState } from 'react';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Alert from '@mui/material/Alert';

interface SettingsSectionProps {
  currentMultiplier: number;
  merchantId: string;
  onRequestChange?: (newMultiplier: number) => void;
}

const SettingsSection = ({ currentMultiplier, merchantId: _merchantId, onRequestChange }: SettingsSectionProps) => {
  const [selectedMultiplier, setSelectedMultiplier] = useState<number>(currentMultiplier);
  const [requestSent, setRequestSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const multiplierOptions = [
    { value: 1, label: '1x (Standard)', description: 'Standard plastic removal rate' },
    { value: 2, label: '2x (Double)', description: 'Double the environmental impact' },
    { value: 5, label: '5x (Strong)', description: 'Strong commitment to sustainability' },
    { value: 10, label: '10x (Hero Campaign)', description: 'Maximum impact for special campaigns' },
  ];

  const handleRequestChange = () => {
    if (selectedMultiplier === currentMultiplier) return;

    setIsSubmitting(true);

    // Simulate API call - in production, this would call the backend
    setTimeout(() => {
      if (onRequestChange) {
        onRequestChange(selectedMultiplier);
      }
      setRequestSent(true);
      setIsSubmitting(false);
    }, 500);
  };

  const currentOption = multiplierOptions.find(opt => opt.value === currentMultiplier);

  return (
    <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">Settings</h3>
        <p className="text-sm text-gray-500">
          Manage your environmental program settings
        </p>
      </div>

      {/* Settings Content */}
      <div className="p-6">
        {/* Success Alert */}
        {requestSent && (
          <Alert severity="success" className="mb-4" onClose={() => setRequestSent(false)}>
            Multiplier change request submitted. Our team will review and update your settings.
          </Alert>
        )}

        {/* Current Multiplier */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Current Multiplier</h4>
          <div className="flex items-center gap-4">
            <div className="bg-green-50 border border-green-200 rounded-md px-4 py-3">
              <span className="text-2xl font-bold text-green-700">{currentMultiplier}x</span>
              <span className="text-sm text-green-600 ml-2">{currentOption?.label.split('(')[1]?.replace(')', '')}</span>
            </div>
            <p className="text-sm text-gray-600">
              {currentOption?.description}
            </p>
          </div>
        </div>

        {/* Impact Explanation */}
        <div className="bg-gray-50 rounded-md p-4 mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">How Multipliers Work</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600 mb-2">
                The multiplier amplifies the environmental impact shown to your customers:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Product with 17g plastic at <strong>1x</strong> = 17g removed</li>
                <li>Product with 17g plastic at <strong>5x</strong> = 85g removed</li>
                <li>Product with 17g plastic at <strong>10x</strong> = 170g removed</li>
              </ul>
            </div>
            <div>
              <p className="text-gray-600 mb-2">
                Higher multipliers mean:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Greater environmental impact per product</li>
                <li>Stronger ESG positioning</li>
                <li>Higher fees (proportional to multiplier)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Request Multiplier Change */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Request Multiplier Change</h4>
          <div className="flex flex-col md:flex-row gap-4">
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>New Multiplier</InputLabel>
              <Select
                value={selectedMultiplier}
                onChange={(e) => setSelectedMultiplier(Number(e.target.value))}
                label="New Multiplier"
              >
                {multiplierOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              variant="contained"
              onClick={handleRequestChange}
              disabled={selectedMultiplier === currentMultiplier || isSubmitting}
              sx={{ textTransform: 'none' }}
            >
              {isSubmitting ? 'Submitting...' : 'Request Change'}
            </Button>
          </div>

          {selectedMultiplier !== currentMultiplier && (
            <p className="text-sm text-blue-600 mt-2">
              Changing from {currentMultiplier}x to {selectedMultiplier}x will affect your billing rate.
            </p>
          )}
        </div>

        {/* Cost Comparison Table */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Cost Comparison (per 1kg product plastic)</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-medium text-gray-700">Multiplier</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-700">Impact Shown</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-700">Cost per kg</th>
                </tr>
              </thead>
              <tbody>
                {multiplierOptions.map((option) => (
                  <tr
                    key={option.value}
                    className={`border-b border-gray-100 ${option.value === currentMultiplier ? 'bg-green-50' : ''}`}
                  >
                    <td className="py-2 px-3">
                      <span className={option.value === currentMultiplier ? 'font-semibold text-green-700' : ''}>
                        {option.label}
                      </span>
                      {option.value === currentMultiplier && (
                        <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                          Current
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3">{option.value} kg</td>
                    <td className="py-2 px-3">€{(0.11 * option.value).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsSection;
