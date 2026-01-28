// CSR26 Admin Merchant Manager
// Admin interface for managing merchants: list, create, edit, view transactions
// Requirements: List all merchants, create new, set multiplier, view transactions

import { useEffect, useState, useCallback } from 'react';
import { merchantApi, partnerApi } from '../../api/apiClient';
import LoadingSpinner from '../../components/LoadingSpinner';

interface PartnerBasic {
  id: string;
  name: string;
}

interface MerchantWithCounts {
  id: string;
  name: string;
  email: string;
  multiplier: number;
  pricePerKg: number | null;
  monthlyBilling: boolean;
  currentBalance: string | number;
  active: boolean;
  partnerId: string | null;
  lastBillingDate: string | null;
  createdAt: string;
  _count?: {
    transactions: number;
    skus: number;
  };
}

interface MerchantFormData {
  name: string;
  email: string;
  multiplier: number;
  monthlyBilling: boolean;
  partnerId?: string;
}

const MerchantManager = () => {
  const [merchants, setMerchants] = useState<MerchantWithCounts[]>([]);
  const [partners, setPartners] = useState<PartnerBasic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingMerchant, setEditingMerchant] = useState<MerchantWithCounts | null>(null);
  const [formData, setFormData] = useState<MerchantFormData>({
    name: '',
    email: '',
    multiplier: 1,
    monthlyBilling: true,
  });

  const fetchMerchants = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await merchantApi.getAll();
      setMerchants(response.data.data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPartners = useCallback(async () => {
    try {
      const response = await partnerApi.getAll();
      setPartners(response.data.data.map((p) => ({ id: p.id, name: p.name })));
    } catch (err) {
      console.error('Failed to fetch partners:', err);
    }
  }, []);

  useEffect(() => {
    fetchMerchants();
    fetchPartners();
  }, [fetchMerchants, fetchPartners]);

  const handleCreate = () => {
    setEditingMerchant(null);
    setFormData({ name: '', email: '', multiplier: 1, monthlyBilling: true });
    setShowForm(true);
  };

  const handleEdit = (merchant: MerchantWithCounts) => {
    setEditingMerchant(merchant);
    setFormData({
      name: merchant.name,
      email: merchant.email,
      multiplier: merchant.multiplier,
      monthlyBilling: merchant.monthlyBilling,
      partnerId: merchant.partnerId || undefined,
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    setError(null);

    // Validation
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }
    if (!editingMerchant && !formData.email.trim()) {
      setError('Email is required');
      return;
    }

    try {
      if (editingMerchant) {
        await merchantApi.update(editingMerchant.id, formData);
      } else {
        await merchantApi.create(formData);
      }
      setShowForm(false);
      fetchMerchants();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingMerchant(null);
    setFormData({ name: '', email: '', multiplier: 1, monthlyBilling: true });
  };

  const handleToggleActive = async (merchant: MerchantWithCounts) => {
    try {
      await merchantApi.update(merchant.id, { active: !merchant.active });
      fetchMerchants();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Merchant Management</h3>
          <p className="text-sm text-gray-600">{merchants.length} total merchants</p>
        </div>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
        >
          Add Merchant
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-md shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {editingMerchant ? 'Edit Merchant' : 'Add Merchant'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  disabled={!!editingMerchant}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Multiplier</label>
                <select
                  value={formData.multiplier}
                  onChange={(e) => setFormData({ ...formData, multiplier: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value={1}>1x (Standard)</option>
                  <option value={2}>2x (Double)</option>
                  <option value={5}>5x (Strong)</option>
                  <option value={10}>10x (Hero Campaign)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Partner</label>
                <select
                  value={formData.partnerId || ''}
                  onChange={(e) => setFormData({ ...formData, partnerId: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">No Partner (Direct)</option>
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Attribution: Master → Partner → Merchant</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="monthlyBilling"
                  checked={formData.monthlyBilling}
                  onChange={(e) => setFormData({ ...formData, monthlyBilling: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="monthlyBilling" className="text-sm text-gray-700">
                  Enable monthly billing
                </label>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {editingMerchant ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="large" />
        </div>
      ) : (
        /* Table */
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Email</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Partner</th>
                <th className="px-4 py-3 text-center font-medium text-gray-700">Multiplier</th>
                <th className="px-4 py-3 text-center font-medium text-gray-700">Transactions</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">Balance</th>
                <th className="px-4 py-3 text-center font-medium text-gray-700">Status</th>
                <th className="px-4 py-3 text-center font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {merchants.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{m.name}</td>
                  <td className="px-4 py-3 text-gray-600">{m.email}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {m.partnerId
                      ? partners.find(p => p.id === m.partnerId)?.name || 'Unknown'
                      : <span className="text-gray-400">Direct</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                      {m.multiplier}x
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">
                    {m._count?.transactions ?? 0}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {Number(m.currentBalance).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        m.active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {m.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex gap-1 justify-center">
                      <button
                        onClick={() => handleEdit(m)}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleActive(m)}
                        className={`px-2 py-1 rounded text-xs ${
                          m.active
                            ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {m.active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {merchants.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No merchants found. Click "Add Merchant" to create one.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MerchantManager;
