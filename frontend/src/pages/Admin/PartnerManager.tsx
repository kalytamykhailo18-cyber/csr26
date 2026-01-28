// CSR26 Admin Partner Manager
// Admin interface for managing partners: list, create, edit
// Partners are the middle tier: Master → Partner → Merchant

import { useEffect, useState, useCallback } from 'react';
import { partnerApi } from '../../api/apiClient';
import LoadingSpinner from '../../components/LoadingSpinner';

interface PartnerWithCounts {
  id: string;
  name: string;
  email: string;
  contactPerson: string | null;
  commissionRate: number;
  active: boolean;
  createdAt: string;
  _count: {
    merchants: number;
  };
}

interface PartnerFormData {
  name: string;
  email: string;
  contactPerson: string;
  commissionRate: number;
}

const PartnerManager = () => {
  const [partners, setPartners] = useState<PartnerWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPartner, setEditingPartner] = useState<PartnerWithCounts | null>(null);
  const [formData, setFormData] = useState<PartnerFormData>({
    name: '',
    email: '',
    contactPerson: '',
    commissionRate: 0,
  });

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await partnerApi.getAll();
      setPartners(response.data.data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const handleCreate = () => {
    setEditingPartner(null);
    setFormData({ name: '', email: '', contactPerson: '', commissionRate: 0 });
    setShowForm(true);
  };

  const handleEdit = (partner: PartnerWithCounts) => {
    setEditingPartner(partner);
    setFormData({
      name: partner.name,
      email: partner.email,
      contactPerson: partner.contactPerson || '',
      commissionRate: partner.commissionRate,
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
    if (!editingPartner && !formData.email.trim()) {
      setError('Email is required');
      return;
    }

    try {
      if (editingPartner) {
        await partnerApi.update(editingPartner.id, {
          name: formData.name,
          contactPerson: formData.contactPerson || undefined,
          commissionRate: formData.commissionRate,
        });
      } else {
        await partnerApi.create({
          name: formData.name,
          email: formData.email,
          contactPerson: formData.contactPerson || undefined,
          commissionRate: formData.commissionRate,
        });
      }
      setShowForm(false);
      fetchPartners();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingPartner(null);
    setFormData({ name: '', email: '', contactPerson: '', commissionRate: 0 });
  };

  const handleToggleActive = async (partner: PartnerWithCounts) => {
    try {
      await partnerApi.update(partner.id, { active: !partner.active });
      fetchPartners();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Partner Management</h3>
          <p className="text-sm text-gray-600">{partners.length} total partners</p>
        </div>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
        >
          Add Partner
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
              {editingPartner ? 'Edit Partner' : 'Add Partner'}
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
                  disabled={!!editingPartner}
                />
                {editingPartner && (
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed after creation</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Commission Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.commissionRate}
                  onChange={(e) => setFormData({ ...formData, commissionRate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <p className="text-xs text-gray-500 mt-1">Partner's commission percentage on revenue</p>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {editingPartner ? 'Update' : 'Create'}
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
                <th className="px-4 py-3 text-left font-medium text-gray-700">Contact</th>
                <th className="px-4 py-3 text-center font-medium text-gray-700">Commission</th>
                <th className="px-4 py-3 text-center font-medium text-gray-700">Merchants</th>
                <th className="px-4 py-3 text-center font-medium text-gray-700">Status</th>
                <th className="px-4 py-3 text-center font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {partners.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                  <td className="px-4 py-3 text-gray-600">{p.email}</td>
                  <td className="px-4 py-3 text-gray-600">{p.contactPerson || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                      {p.commissionRate}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">
                    {p._count.merchants}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        p.active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {p.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex gap-1 justify-center">
                      <button
                        onClick={() => handleEdit(p)}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleActive(p)}
                        className={`px-2 py-1 rounded text-xs ${
                          p.active
                            ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {p.active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {partners.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No partners found. Click "Add Partner" to create one.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PartnerManager;
