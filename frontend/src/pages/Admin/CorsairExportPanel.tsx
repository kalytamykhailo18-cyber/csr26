// CSR26 Admin Corsair Export Panel
// Admin interface for Corsair Connect exports
// Requirements: View stats, export pending, export all, download CSV

import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '../../api/apiClient';
import LoadingSpinner from '../../components/LoadingSpinner';

interface CorsairStats {
  totalCertified: number;
  totalExported: number;
  pendingExport: number;
  threshold: number;
}

const CorsairExportPanel = () => {
  const [stats, setStats] = useState<CorsairStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [lastExport, setLastExport] = useState<{ type: string; count: number } | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await adminApi.getCorsairStats();
      setStats(response.data.data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleExportPending = async () => {
    setExporting(true);
    setError(null);

    try {
      const response = await adminApi.exportPendingCorsair();
      setLastExport({ type: 'pending', count: response.data.data.recordCount });
      fetchStats();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setExporting(false);
    }
  };

  const handleExportAll = async () => {
    setExporting(true);
    setError(null);

    try {
      const response = await adminApi.exportAllCorsair();
      setLastExport({ type: 'all', count: response.data.data.recordCount });
      fetchStats();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadCSV = (type: 'pending' | 'all') => {
    const url = adminApi.getCorsairDownloadUrl(type);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800">Corsair Connect Export</h3>
        <p className="text-sm text-gray-600">
          Export certified user data to Corsair Connect system
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Success */}
      {lastExport && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
          Successfully exported {lastExport.count} users ({lastExport.type} export)
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="large" />
        </div>
      ) : stats ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-sm text-blue-600">Certification Threshold</p>
              <p className="text-2xl font-bold text-blue-800">{stats.threshold}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-sm text-green-600">Total Certified</p>
              <p className="text-2xl font-bold text-green-800">{stats.totalCertified}</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
              <p className="text-sm text-purple-600">Already Exported</p>
              <p className="text-2xl font-bold text-purple-800">{stats.totalExported}</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <p className="text-sm text-yellow-600">Pending Export</p>
              <p className="text-2xl font-bold text-yellow-800">{stats.pendingExport}</p>
            </div>
          </div>

          {/* Export Actions */}
          <div className="bg-white border border-gray-200 rounded-md p-6">
            <h4 className="text-md font-semibold text-gray-800 mb-4">Export Actions</h4>

            <div className="space-y-4">
              {/* Export Pending */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                <div>
                  <p className="font-medium text-gray-800">Export Pending Users</p>
                  <p className="text-sm text-gray-500">
                    Export {stats.pendingExport} certified users not yet exported
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleExportPending}
                    disabled={exporting || stats.pendingExport === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
                  >
                    {exporting ? 'Exporting...' : 'Export'}
                  </button>
                  <button
                    onClick={() => handleDownloadCSV('pending')}
                    disabled={stats.pendingExport === 0}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50 text-sm"
                  >
                    Download CSV
                  </button>
                </div>
              </div>

              {/* Export All */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                <div>
                  <p className="font-medium text-gray-800">Export All Certified Users</p>
                  <p className="text-sm text-gray-500">
                    Export all {stats.totalCertified} certified users (full report)
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleExportAll}
                    disabled={exporting || stats.totalCertified === 0}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 text-sm"
                  >
                    {exporting ? 'Exporting...' : 'Export All'}
                  </button>
                  <button
                    onClick={() => handleDownloadCSV('all')}
                    disabled={stats.totalCertified === 0}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50 text-sm"
                  >
                    Download CSV
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h4 className="font-medium text-blue-800 mb-2">Export Information</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>Users are automatically exported when they reach the {stats.threshold} certification threshold</li>
              <li>Monthly batch exports run automatically on the 1st of each month</li>
              <li>Export includes: email, name, DOB, address, impact, transaction dates, merchant/partner IDs</li>
              <li>Each user receives a unique Corsair ID upon first export</li>
            </ul>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default CorsairExportPanel;
