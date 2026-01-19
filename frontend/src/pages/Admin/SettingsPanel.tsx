// CSR26 Admin Settings Panel
// Manage platform settings: pricePerKg, threshold, multiplier, billing minimum
// RULE: Use HTML + Tailwind for layout, MUI only for interactive components

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchSettings, updateSetting } from '../../store/slices/settingsSlice';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';

interface SettingRow {
  key: string;
  label: string;
  description: string;
  type: 'number' | 'text';
  unit?: string;
}

const settingsConfig: SettingRow[] = [
  {
    key: 'PRICE_PER_KG',
    label: 'Price per Kg',
    description: 'Cost per kilogram of plastic removal (€)',
    type: 'number',
    unit: '€',
  },
  {
    key: 'CERTIFICATION_THRESHOLD',
    label: 'Certification Threshold',
    description: 'Minimum amount for certification (€)',
    type: 'number',
    unit: '€',
  },
  {
    key: 'DEFAULT_MULTIPLIER',
    label: 'Default Multiplier',
    description: 'Default impact multiplier for new merchants',
    type: 'number',
    unit: 'x',
  },
  {
    key: 'MONTHLY_BILLING_MINIMUM',
    label: 'Monthly Billing Minimum',
    description: 'Minimum balance for monthly billing (€)',
    type: 'number',
    unit: '€',
  },
];

const SettingsPanel = () => {
  const dispatch = useAppDispatch();
  const { settings, loading, error } = useAppSelector((state) => state.settings);

  // Local state for form values
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch settings on mount
  useEffect(() => {
    dispatch(fetchSettings());
  }, [dispatch]);

  // Initialize form values when settings load
  useEffect(() => {
    if (settings) {
      setFormValues(settings);
    }
  }, [settings]);

  // Handle save
  const handleSave = async (key: string) => {
    const value = formValues[key];
    if (!value) return;

    const result = await dispatch(updateSetting({ key, value }));
    if (updateSetting.fulfilled.match(result)) {
      setEditingKey(null);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  // Handle cancel
  const handleCancel = (key: string) => {
    if (settings) {
      setFormValues((prev) => ({ ...prev, [key]: settings[key] }));
    }
    setEditingKey(null);
  };

  if (loading && !settings) {
    return (
      <div className="flex justify-center py-12">
        <CircularProgress size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800">Platform Settings</h3>
        <p className="text-sm text-gray-500">
          Configure global platform settings. Changes take effect immediately.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" onClose={() => {}}>
          {error}
        </Alert>
      )}

      {/* Success Alert */}
      {saveSuccess && (
        <Alert severity="success" onClose={() => setSaveSuccess(false)}>
          Setting updated successfully.
        </Alert>
      )}

      {/* Settings List */}
      <div className="bg-gray-50 rounded-md divide-y divide-gray-200">
        {settingsConfig.map((setting) => {
          const isEditing = editingKey === setting.key;
          const currentValue = formValues[setting.key] || '';

          return (
            <div key={setting.key} className="p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{setting.label}</p>
                  <p className="text-xs text-gray-500">{setting.description}</p>
                </div>

                <div className="flex items-center gap-3">
                  {isEditing ? (
                    <>
                      <TextField
                        type={setting.type}
                        size="small"
                        value={currentValue}
                        onChange={(e) =>
                          setFormValues((prev) => ({
                            ...prev,
                            [setting.key]: e.target.value,
                          }))
                        }
                        slotProps={{
                          input: {
                            endAdornment: setting.unit && (
                              <span className="text-gray-500 text-sm">{setting.unit}</span>
                            ),
                          },
                        }}
                        sx={{ width: 150 }}
                      />
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleSave(setting.key)}
                        disabled={loading}
                        sx={{ textTransform: 'none' }}
                      >
                        Save
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleCancel(setting.key)}
                        sx={{ textTransform: 'none' }}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="text-sm font-medium text-gray-800 bg-white px-3 py-1.5 rounded-md border border-gray-200">
                        {currentValue} {setting.unit}
                      </span>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setEditingKey(setting.key)}
                        sx={{ textTransform: 'none' }}
                      >
                        Edit
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 rounded-md p-4 flex items-start gap-3">
        <svg
          className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div>
          <p className="text-sm font-medium text-blue-800">Important</p>
          <p className="text-xs text-blue-600 mt-1">
            These settings affect the entire platform. The price per kg is used to calculate
            environmental impact. The certification threshold determines when users become
            Certified Asset holders.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
