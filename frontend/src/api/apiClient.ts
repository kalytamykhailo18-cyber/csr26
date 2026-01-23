// CSR26 API Client
// Centralized Axios instance for all API calls
// RULE: All API calls go through Redux slices, NOT direct from components

import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse, ApiErrorResponse } from '../types';

// API base URL from environment - NEVER hardcoded
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Storage key for auth token
const TOKEN_KEY = 'csr26_token';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError<ApiErrorResponse>) => {
    // Handle 401 - clear token and redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      // Navigation will be handled by Redux state
    }

    // Extract error message
    const errorMessage = error.response?.data?.error?.message
      || error.message
      || 'An unexpected error occurred';

    // Return a standardized error
    return Promise.reject(new Error(errorMessage));
  }
);

// ============================================
// TOKEN MANAGEMENT
// ============================================

export const setAuthToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const clearAuthToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

// ============================================
// API ENDPOINTS
// ============================================

// Auth endpoints
export const authApi = {
  register: (data: {
    email: string;
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    street?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    state?: string;
  }) =>
    apiClient.post<ApiResponse<{ user: import('../types').User; token: string }>>('/auth/register', data),

  sendMagicLink: (email: string) =>
    apiClient.post<ApiResponse<{ message: string }>>('/auth/magic-link', { email }),

  verifyToken: (token: string) =>
    apiClient.get<ApiResponse<{ user: import('../types').User; token: string }>>(`/auth/verify/${token}`),

  getMe: () =>
    apiClient.get<ApiResponse<import('../types').User>>('/auth/me'),
};

// SKU endpoints
export const skuApi = {
  getByCode: (code: string) =>
    apiClient.get<ApiResponse<import('../types').Sku>>(`/skus/${code}`),

  getAll: () =>
    apiClient.get<ApiResponse<import('../types').Sku[]>>('/skus'),

  create: (data: Partial<import('../types').Sku>) =>
    apiClient.post<ApiResponse<import('../types').Sku>>('/skus', data),

  update: (code: string, data: Partial<import('../types').Sku>) =>
    apiClient.put<ApiResponse<import('../types').Sku>>(`/skus/${code}`, data),

  delete: (code: string) =>
    apiClient.delete<ApiResponse<{ message: string }>>(`/skus/${code}`),
};

// Settings endpoints
export const settingsApi = {
  getAll: () =>
    apiClient.get<ApiResponse<import('../types').SettingsMap>>('/settings'),

  get: (key: string) =>
    apiClient.get<ApiResponse<import('../types').Setting>>(`/settings/${key}`),

  update: (key: string, data: { value: string; description?: string }) =>
    apiClient.put<ApiResponse<import('../types').Setting>>(`/settings/${key}`, data),
};

// Transaction endpoints
export const transactionApi = {
  create: (data: import('../types').CreateTransactionRequest) =>
    apiClient.post<ApiResponse<import('../types').Transaction>>('/transactions', data),

  getAll: (params?: { limit?: number; offset?: number; paymentMode?: string; merchantId?: string }) =>
    apiClient.get<ApiResponse<import('../types').TransactionListResponse>>('/transactions', { params }),

  getById: (id: string) =>
    apiClient.get<ApiResponse<import('../types').TransactionWithRelations>>(`/transactions/${id}`),
};

// Wallet endpoints
export const walletApi = {
  get: () =>
    apiClient.get<ApiResponse<import('../types').WalletSummary>>('/wallet'),

  getByEmail: (email: string) =>
    apiClient.get<ApiResponse<import('../types').WalletSummary>>(`/wallet/email/${email}`),
};

// Gift code endpoints
export const giftCodeApi = {
  validate: (data: import('../types').ValidateGiftCodeRequest) =>
    apiClient.post<ApiResponse<import('../types').ValidateGiftCodeResponse>>('/gift-codes/validate', data),

  getAll: (params?: { skuCode?: string; status?: string }) =>
    apiClient.get<ApiResponse<{ giftCodes: import('../types').GiftCode[]; total: number }>>('/gift-codes', { params }),

  batchUpload: (data: import('../types').BatchUploadGiftCodesRequest) =>
    apiClient.post<ApiResponse<{ count: number; codes: import('../types').GiftCode[] }>>('/gift-codes/batch', data),

  deactivate: (code: string) =>
    apiClient.delete<ApiResponse<import('../types').GiftCode>>(`/gift-codes/${code}`),

  activate: (code: string) =>
    apiClient.patch<ApiResponse<import('../types').GiftCode>>(`/gift-codes/${code}/activate`),
};

// Merchant endpoints
export const merchantApi = {
  getAll: () =>
    apiClient.get<ApiResponse<import('../types').MerchantWithCounts[]>>('/merchants'),

  getById: (id: string) =>
    apiClient.get<ApiResponse<import('../types').MerchantSummary>>(`/merchants/${id}`),

  getTransactions: (id: string, params?: { limit?: number; offset?: number; dateFrom?: string; dateTo?: string }) =>
    apiClient.get<ApiResponse<import('../types').TransactionListResponse>>(`/merchants/${id}/transactions`, { params }),

  getBilling: (id: string) =>
    apiClient.get<ApiResponse<import('../types').MerchantBillingInfo>>(`/merchants/${id}/billing`),

  create: (data: Partial<import('../types').Merchant>) =>
    apiClient.post<ApiResponse<import('../types').Merchant>>('/merchants', data),

  update: (id: string, data: Partial<import('../types').Merchant>) =>
    apiClient.put<ApiResponse<import('../types').Merchant>>(`/merchants/${id}`, data),
};

// Payment endpoints (Stripe)
export const paymentApi = {
  createIntent: (data: import('../types').CreatePaymentIntentRequest) =>
    apiClient.post<ApiResponse<import('../types').PaymentIntentResponse>>('/payments/create-intent', data),

  resumePayment: (transactionId: string) =>
    apiClient.post<ApiResponse<import('../types').PaymentIntentResponse>>(`/payments/resume/${transactionId}`),

  confirmPayment: (transactionId: string) =>
    apiClient.post<ApiResponse<{ status: string; message: string }>>(`/payments/confirm/${transactionId}`),
};

// User endpoints (admin)
export const userApi = {
  getAll: (params?: { search?: string; status?: string; limit?: number; offset?: number; sortBy?: string; sortOrder?: string }) =>
    apiClient.get<ApiResponse<import('../types').UserListResponse>>('/users', { params }),

  getById: (id: string) =>
    apiClient.get<ApiResponse<import('../types').UserWithTransactions>>(`/users/${id}`),

  update: (id: string, data: Partial<import('../types').User>) =>
    apiClient.put<ApiResponse<import('../types').User>>(`/users/${id}`, data),

  adjustWallet: (id: string, data: { amount: number; reason: string }) =>
    apiClient.post<ApiResponse<import('../types').UserWithCounts>>(`/users/${id}/adjust-wallet`, data),

  getExportUrl: (params?: { status?: string; startDate?: string; endDate?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    // Add auth token to query params for window.open() download
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      queryParams.append('token', token);
    }

    const queryString = queryParams.toString();
    return `${API_BASE_URL}/users/export/csv${queryString ? `?${queryString}` : ''}`;
  },
};

// Admin endpoints
export const adminApi = {
  // Corsair Connect export
  getCorsairStats: () =>
    apiClient.get<ApiResponse<{ totalCertified: number; totalExported: number; pendingExport: number; threshold: number }>>('/admin/corsair/stats'),

  exportPendingCorsair: () =>
    apiClient.post<ApiResponse<{ exportDate: string; recordCount: number; records: unknown[] }>>('/admin/corsair/export-pending'),

  exportAllCorsair: () =>
    apiClient.post<ApiResponse<{ exportDate: string; recordCount: number; records: unknown[] }>>('/admin/corsair/export-all'),

  getCorsairDownloadUrl: (type: 'pending' | 'all' = 'all') => {
    const token = localStorage.getItem(TOKEN_KEY);
    return `${API_BASE_URL}/admin/corsair/download?type=${type}${token ? `&token=${token}` : ''}`;
  },

  // Reports
  getMonthlySummary: (params?: { year?: number; month?: number }) =>
    apiClient.get<ApiResponse<unknown>>('/admin/reports/summary', { params }),

  getRevenueReport: (params?: { startDate?: string; endDate?: string; groupBy?: 'merchant' | 'partner' }) =>
    apiClient.get<ApiResponse<unknown>>('/admin/reports/revenue', { params }),

  getImpactReport: () =>
    apiClient.get<ApiResponse<unknown>>('/admin/reports/impact'),

  getUserGrowthReport: (params?: { days?: number }) =>
    apiClient.get<ApiResponse<unknown>>('/admin/reports/users', { params }),

  // Transaction management
  getAllTransactions: (params?: {
    limit?: number;
    offset?: number;
    paymentMode?: string;
    paymentStatus?: string;
    merchantId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }) =>
    apiClient.get<ApiResponse<import('../types').TransactionListResponse>>('/admin/transactions', { params }),

  updateTransactionStatus: (id: string, paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED') =>
    apiClient.patch<ApiResponse<import('../types').Transaction>>(`/admin/transactions/${id}`, { paymentStatus }),

  // Admin access
  verifyAdminAccess: (code: string) =>
    apiClient.post<ApiResponse<{ message: string; role?: string; valid?: boolean }>>('/admin/access', { code }),

  // Billing
  getBillingStats: () =>
    apiClient.get<ApiResponse<unknown>>('/admin/billing/stats'),

  getOutstandingBalances: () =>
    apiClient.get<ApiResponse<unknown>>('/admin/billing/outstanding'),

  runMonthlyBilling: (params?: { year?: number; month?: number }) =>
    apiClient.post<ApiResponse<unknown>>('/admin/billing/run', params),

  getInvoice: (id: string) =>
    apiClient.get<ApiResponse<unknown>>(`/admin/billing/invoices/${id}`),

  payInvoice: (id: string, stripePaymentId?: string) =>
    apiClient.post<ApiResponse<unknown>>(`/admin/billing/invoices/${id}/pay`, { stripePaymentId }),

  // Cron
  runDailyCron: () =>
    apiClient.post<ApiResponse<unknown>>('/admin/cron/daily'),

  runMonthlyCron: () =>
    apiClient.post<ApiResponse<unknown>>('/admin/cron/monthly'),

  runAllCron: () =>
    apiClient.post<ApiResponse<unknown>>('/admin/cron/all'),
};

// Merchant self-service endpoints
export const merchantSelfServiceApi = {
  getCurrentMerchant: () =>
    apiClient.get<ApiResponse<unknown>>('/merchants/me'),

  getMyTransactions: (params?: { limit?: number; offset?: number; dateFrom?: string; dateTo?: string }) =>
    apiClient.get<ApiResponse<import('../types').TransactionListResponse>>('/merchants/me/transactions', { params }),

  getMyBilling: () =>
    apiClient.get<ApiResponse<import('../types').MerchantBillingInfo>>('/merchants/me/billing'),

  getMyInvoice: (invoiceId: string) =>
    apiClient.get<ApiResponse<unknown>>(`/merchants/me/invoices/${invoiceId}`),

  getMySKUs: () =>
    apiClient.get<ApiResponse<import('../types').Sku[]>>('/merchants/me/skus'),
};

// Partner endpoints
// Uses separate token storage to avoid conflicts with user auth
const PARTNER_TOKEN_KEY = 'csr26_partner_token';

export const setPartnerToken = (token: string): void => {
  localStorage.setItem(PARTNER_TOKEN_KEY, token);
};

export const getPartnerToken = (): string | null => {
  return localStorage.getItem(PARTNER_TOKEN_KEY);
};

export const clearPartnerToken = (): void => {
  localStorage.removeItem(PARTNER_TOKEN_KEY);
};

// Create a separate axios instance for partner API calls
const partnerClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Partner request interceptor - use partner token
partnerClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(PARTNER_TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Partner response interceptor
partnerClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError<ApiErrorResponse>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(PARTNER_TOKEN_KEY);
    }
    const errorMessage = error.response?.data?.error?.message
      || error.message
      || 'An unexpected error occurred';
    return Promise.reject(new Error(errorMessage));
  }
);

export const partnerApi = {
  // Auth
  sendMagicLink: (email: string) =>
    apiClient.post<ApiResponse<{ message: string }>>('/partners/auth/magic-link', { email }),

  verifyToken: (token: string) =>
    apiClient.get<ApiResponse<{
      partner: { id: string; name: string; email: string };
      token: string;
    }>>(`/partners/auth/verify/${token}`),

  // Dashboard (uses partner token)
  getDashboard: () =>
    partnerClient.get<ApiResponse<{
      partner: {
        id: string;
        name: string;
        email: string;
        contactPerson: string | null;
        commissionRate: number;
        active: boolean;
      };
      merchants: Array<{
        id: string;
        name: string;
        email: string;
        multiplier: number;
        currentBalance: number;
        transactionCount: number;
      }>;
      stats: {
        totalMerchants: number;
        totalTransactions: number;
        totalRevenue: number;
        totalImpactKg: number;
        monthlyTransactions: number;
        monthlyRevenue: number;
        monthlyImpactKg: number;
      };
    }>>('/partners/me'),

  getMerchants: () =>
    partnerClient.get<ApiResponse<Array<{
      id: string;
      name: string;
      email: string;
      multiplier: number;
      monthlyBilling: boolean;
      currentBalance: number;
      transactionCount: number;
      skuCount: number;
      totalRevenue: number;
      totalImpactKg: number;
      createdAt: string;
    }>>>('/partners/me/merchants'),

  getTransactions: (params?: { limit?: number; offset?: number; merchantId?: string }) =>
    partnerClient.get<ApiResponse<{
      transactions: Array<{
        id: string;
        amount: number;
        impactKg: number;
        paymentMode: string;
        paymentStatus: string;
        createdAt: string;
        user: { email: string; firstName: string | null; lastName: string | null } | null;
        merchant: { name: string } | null;
        sku: { code: string; name: string } | null;
      }>;
      total: number;
    }>>('/partners/me/transactions', { params }),

  getSummaryReport: (params?: { year?: number; month?: number }) =>
    partnerClient.get<ApiResponse<{
      period: { year: number; month: number; startDate: string; endDate: string };
      totals: {
        transactions: number;
        revenue: number;
        impactKg: number;
        estimatedCommission: number;
      };
      byMerchant: Array<{ id: string; name: string; count: number; revenue: number; impactKg: number }>;
      byPaymentMode: Record<string, { count: number; revenue: number; impactKg: number }>;
    }>>('/partners/me/reports/summary', { params }),
};

export default apiClient;
