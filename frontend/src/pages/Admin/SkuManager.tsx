// CSR26 Admin SKU Manager
// CRUD operations for SKUs
// RULE: Use HTML + Tailwind for layout, MUI only for interactive components

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchAllSkus, createSku, updateSku, deleteSku } from '../../store/slices/skuSlice';
import type { Sku, PaymentMode } from '../../types';
import { formatEUR } from '../../utils/formatters';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Switch from '@mui/material/Switch';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

const emptySkuForm: Partial<Sku> = {
  code: '',
  name: '',
  description: '',
  paymentMode: 'CLAIM',
  price: 0,
  weightGrams: undefined,
  multiplier: 1,
  paymentRequired: false,
  validationRequired: false,
  active: true,
};

const SkuManager = () => {
  const dispatch = useAppDispatch();
  const { skus, loading, error } = useAppSelector((state) => state.sku);

  // Local state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSku, setEditingSku] = useState<Partial<Sku> | null>(null);
  const [formData, setFormData] = useState<Partial<Sku>>(emptySkuForm);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch SKUs on mount
  useEffect(() => {
    dispatch(fetchAllSkus());
  }, [dispatch]);

  // Filter SKUs
  const filteredSkus = skus.filter((sku) => {
    if (filter === 'active') return sku.active;
    if (filter === 'inactive') return !sku.active;
    return true;
  });

  // Open create dialog
  const handleCreate = () => {
    setEditingSku(null);
    setFormData(emptySkuForm);
    setDialogOpen(true);
  };

  // Open edit dialog
  const handleEdit = (sku: Sku) => {
    setEditingSku(sku);
    setFormData({ ...sku });
    setDialogOpen(true);
  };

  // Handle form field change
  const handleFieldChange = (field: keyof Sku, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle save
  const handleSave = async () => {
    if (!formData.code || !formData.name) return;

    let result;
    if (editingSku) {
      // Update existing SKU
      result = await dispatch(
        updateSku({
          code: editingSku.code!,
          data: formData,
        })
      );
    } else {
      // Create new SKU
      result = await dispatch(createSku(formData));
    }

    if (updateSku.fulfilled.match(result) || createSku.fulfilled.match(result)) {
      setDialogOpen(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  // Handle deactivate
  const handleDeactivate = async (code: string) => {
    if (!confirm('Are you sure you want to deactivate this SKU?')) return;
    await dispatch(deleteSku(code));
  };

  // Get payment mode badge color
  const getPaymentModeBadge = (mode: PaymentMode) => {
    const colors: Record<PaymentMode, string> = {
      CLAIM: 'bg-green-100 text-green-800',
      PAY: 'bg-blue-100 text-blue-800',
      GIFT_CARD: 'bg-purple-100 text-purple-800',
      ALLOCATION: 'bg-orange-100 text-orange-800',
    };
    return colors[mode] || 'bg-gray-100 text-gray-800';
  };

  if (loading && skus.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <CircularProgress size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">SKU Management</h3>
          <p className="text-sm text-gray-500">
            {skus.length} SKUs total, {skus.filter((s) => s.active).length} active
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            size="small"
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </Select>
          <Button
            variant="contained"
            onClick={handleCreate}
            sx={{ textTransform: 'none' }}
          >
            Create SKU
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && <Alert severity="error">{error}</Alert>}

      {/* Success Alert */}
      {saveSuccess && (
        <Alert severity="success" onClose={() => setSaveSuccess(false)}>
          SKU saved successfully.
        </Alert>
      )}

      {/* SKU Table */}
      <div className="bg-gray-50 rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Code
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Mode
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Price
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Multiplier
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredSkus.map((sku) => (
                <tr key={sku.code} className={!sku.active ? 'bg-gray-50 opacity-60' : ''}>
                  <td className="px-4 py-3 text-sm font-mono text-gray-800">
                    {sku.code}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800">{sku.name}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-md ${getPaymentModeBadge(
                        sku.paymentMode
                      )}`}
                    >
                      {sku.paymentMode}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800 text-right">
                    {formatEUR(sku.price)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800 text-center">
                    {sku.multiplier}x
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-md ${
                        sku.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {sku.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleEdit(sku)}
                        sx={{ textTransform: 'none', minWidth: 60 }}
                      >
                        Edit
                      </Button>
                      {sku.active && (
                        <Button
                          variant="outlined"
                          size="small"
                          color="error"
                          onClick={() => handleDeactivate(sku.code)}
                          sx={{ textTransform: 'none', minWidth: 80 }}
                        >
                          Deactivate
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredSkus.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No SKUs found matching the filter.
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingSku ? 'Edit SKU' : 'Create New SKU'}</DialogTitle>
        <DialogContent>
          <div className="space-y-4 pt-4">
            <TextField
              label="SKU Code"
              value={formData.code || ''}
              onChange={(e) => handleFieldChange('code', e.target.value)}
              fullWidth
              disabled={!!editingSku}
              required
            />
            <TextField
              label="Name"
              value={formData.name || ''}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={formData.description || ''}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              fullWidth
              multiline
              rows={2}
            />
            <FormControl fullWidth>
              <InputLabel>Payment Mode</InputLabel>
              <Select
                value={formData.paymentMode || 'CLAIM'}
                onChange={(e) => handleFieldChange('paymentMode', e.target.value)}
                label="Payment Mode"
              >
                <MenuItem value="CLAIM">CLAIM</MenuItem>
                <MenuItem value="PAY">PAY</MenuItem>
                <MenuItem value="GIFT_CARD">GIFT_CARD</MenuItem>
                <MenuItem value="ALLOCATION">ALLOCATION</MenuItem>
              </Select>
            </FormControl>
            <div className="grid grid-cols-2 gap-4">
              <TextField
                label="Price (€)"
                type="number"
                value={formData.price || 0}
                onChange={(e) => handleFieldChange('price', parseFloat(e.target.value) || 0)}
                fullWidth
              />
              <TextField
                label="Multiplier"
                type="number"
                value={formData.multiplier || 1}
                onChange={(e) => handleFieldChange('multiplier', parseInt(e.target.value) || 1)}
                fullWidth
              />
            </div>
            <TextField
              label="Weight (grams)"
              type="number"
              value={formData.weightGrams || ''}
              onChange={(e) =>
                handleFieldChange('weightGrams', e.target.value ? parseInt(e.target.value) : undefined)
              }
              fullWidth
              helperText="For weight-based calculations (e-commerce)"
            />
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Payment Required</span>
              <Switch
                checked={formData.paymentRequired || false}
                onChange={(e) => handleFieldChange('paymentRequired', e.target.checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Validation Required</span>
              <Switch
                checked={formData.validationRequired || false}
                onChange={(e) => handleFieldChange('validationRequired', e.target.checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Active</span>
              <Switch
                checked={formData.active !== false}
                onChange={(e) => handleFieldChange('active', e.target.checked)}
              />
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={loading || !formData.code || !formData.name}
            sx={{ textTransform: 'none' }}
          >
            {editingSku ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default SkuManager;
