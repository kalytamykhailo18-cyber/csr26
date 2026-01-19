// CSR26 Admin Gift Code Manager
// Upload and manage gift codes
// RULE: Use HTML + Tailwind for layout, MUI only for interactive components

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchAllGiftCodes,
  batchUploadGiftCodes,
  deactivateGiftCode,
  activateGiftCode,
  clearLastBatchUpload,
} from '../../store/slices/giftCodeSlice';
import { fetchAllSkus } from '../../store/slices/skuSlice';
import type { GiftCodeStatus } from '../../types';
import { formatDate } from '../../utils/formatters';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import UploadFileIcon from '@mui/icons-material/UploadFile';

const GiftCodeManager = () => {
  const dispatch = useAppDispatch();
  const { giftCodes, lastBatchUpload, loading, error } = useAppSelector(
    (state) => state.giftCode
  );
  const { skus } = useAppSelector((state) => state.sku);

  // Local state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedSku, setSelectedSku] = useState('');
  const [codesText, setCodesText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | GiftCodeStatus>('all');
  const [skuFilter, setSkuFilter] = useState<string>('all');

  // Fetch gift codes and SKUs on mount
  useEffect(() => {
    dispatch(
      fetchAllGiftCodes({
        status: statusFilter === 'all' ? undefined : statusFilter,
        skuCode: skuFilter === 'all' ? undefined : skuFilter,
      })
    );
    dispatch(fetchAllSkus());
  }, [dispatch, statusFilter, skuFilter]);

  // Get gift card SKUs
  const giftCardSkus = skus.filter((s) => s.paymentMode === 'GIFT_CARD' && s.active);

  // Handle batch upload
  const handleUpload = async () => {
    if (!selectedSku || !codesText.trim()) return;

    // Parse codes (one per line, trim whitespace)
    const codes = codesText
      .split('\n')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    if (codes.length === 0) return;

    const result = await dispatch(
      batchUploadGiftCodes({
        skuCode: selectedSku,
        codes,
      })
    );

    if (batchUploadGiftCodes.fulfilled.match(result)) {
      setUploadDialogOpen(false);
      setSelectedSku('');
      setCodesText('');
    }
  };

  // Handle deactivate
  const handleDeactivate = async (code: string) => {
    if (!confirm('Are you sure you want to deactivate this gift code?')) return;
    await dispatch(deactivateGiftCode(code));
  };

  // Handle activate
  const handleActivate = async (code: string) => {
    if (!confirm('Are you sure you want to activate this gift code?')) return;
    await dispatch(activateGiftCode(code));
  };

  // Get status badge color
  const getStatusBadge = (status: GiftCodeStatus) => {
    const colors: Record<GiftCodeStatus, string> = {
      UNUSED: 'bg-green-100 text-green-800',
      USED: 'bg-blue-100 text-blue-800',
      DEACTIVATED: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Filter codes
  const filteredCodes = giftCodes.filter((gc) => {
    if (statusFilter !== 'all' && gc.status !== statusFilter) return false;
    if (skuFilter !== 'all' && gc.skuCode !== skuFilter) return false;
    return true;
  });

  // Count by status
  const unusedCount = giftCodes.filter((gc) => gc.status === 'UNUSED').length;
  const usedCount = giftCodes.filter((gc) => gc.status === 'USED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Gift Code Management</h3>
          <p className="text-sm text-gray-500">
            {giftCodes.length} codes total • {unusedCount} unused • {usedCount} used
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select
            value={skuFilter}
            onChange={(e) => setSkuFilter(e.target.value)}
            size="small"
            displayEmpty
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="all">All SKUs</MenuItem>
            {giftCardSkus.map((sku) => (
              <MenuItem key={sku.code} value={sku.code}>
                {sku.code}
              </MenuItem>
            ))}
          </Select>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            size="small"
            sx={{ minWidth: 130 }}
          >
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="UNUSED">Unused</MenuItem>
            <MenuItem value="USED">Used</MenuItem>
            <MenuItem value="DEACTIVATED">Deactivated</MenuItem>
          </Select>
          <Button
            variant="contained"
            startIcon={<UploadFileIcon />}
            onClick={() => setUploadDialogOpen(true)}
            sx={{ textTransform: 'none' }}
          >
            Upload Codes
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && <Alert severity="error">{error}</Alert>}

      {/* Success Alert */}
      {lastBatchUpload && (
        <Alert severity="success" onClose={() => dispatch(clearLastBatchUpload())}>
          Successfully uploaded {lastBatchUpload.count} gift codes.
        </Alert>
      )}

      {/* Loading State */}
      {loading && giftCodes.length === 0 && (
        <div className="flex justify-center py-12">
          <CircularProgress size={32} />
        </div>
      )}

      {/* Gift Codes Table */}
      {(!loading || giftCodes.length > 0) && (
        <div className="bg-gray-50 rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Code
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    SKU
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Used By
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Used At
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Created
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredCodes.slice(0, 100).map((gc) => (
                  <tr
                    key={gc.code}
                    className={gc.status === 'DEACTIVATED' ? 'bg-gray-50 opacity-60' : ''}
                  >
                    <td className="px-4 py-3 text-sm font-mono text-gray-800">{gc.code}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{gc.skuCode}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-md ${getStatusBadge(
                          gc.status
                        )}`}
                      >
                        {gc.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {gc.usedByUserId || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {gc.usedAt ? formatDate(gc.usedAt) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(gc.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {gc.status === 'UNUSED' && (
                        <Button
                          variant="outlined"
                          size="small"
                          color="error"
                          onClick={() => handleDeactivate(gc.code)}
                          sx={{ textTransform: 'none' }}
                        >
                          Deactivate
                        </Button>
                      )}
                      {gc.status === 'DEACTIVATED' && (
                        <Button
                          variant="outlined"
                          size="small"
                          color="success"
                          onClick={() => handleActivate(gc.code)}
                          sx={{ textTransform: 'none' }}
                        >
                          Activate
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCodes.length === 0 && !loading && (
            <div className="p-8 text-center text-gray-500">
              No gift codes found matching the criteria.
            </div>
          )}

          {filteredCodes.length > 100 && (
            <div className="p-4 text-center text-sm text-gray-500 bg-gray-50 border-t border-gray-200">
              Showing first 100 of {filteredCodes.length} codes. Use filters to narrow results.
            </div>
          )}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Upload Gift Codes</DialogTitle>
        <DialogContent>
          <div className="space-y-4 pt-4">
            <Select
              value={selectedSku}
              onChange={(e) => setSelectedSku(e.target.value)}
              fullWidth
              displayEmpty
            >
              <MenuItem value="" disabled>
                Select SKU
              </MenuItem>
              {giftCardSkus.map((sku) => (
                <MenuItem key={sku.code} value={sku.code}>
                  {sku.code} - {sku.name}
                </MenuItem>
              ))}
            </Select>

            <TextField
              label="Gift Codes (one per line)"
              value={codesText}
              onChange={(e) => setCodesText(e.target.value)}
              fullWidth
              multiline
              rows={10}
              placeholder="CODE001&#10;CODE002&#10;CODE003"
              helperText={
                codesText.trim()
                  ? `${codesText.split('\n').filter((c) => c.trim()).length} codes detected`
                  : 'Enter codes, one per line'
              }
            />

            <div className="bg-yellow-50 rounded-md p-3">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Codes must be unique. Duplicate codes will be skipped.
              </p>
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={loading || !selectedSku || !codesText.trim()}
            sx={{ textTransform: 'none' }}
          >
            Upload
          </Button>
        </DialogActions>
      </Dialog>

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
          <p className="text-sm font-medium text-blue-800">Gift Code Workflow</p>
          <p className="text-xs text-blue-600 mt-1">
            Gift codes are tied to a specific SKU. When a customer enters a valid code on the
            landing page, the SKU&apos;s price is applied as their contribution. Codes can only be
            used once and are marked as USED after redemption.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GiftCodeManager;
