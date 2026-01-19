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
    const queryString = queryParams.toString();
    return `${API_BASE_URL}/users/export/csv${queryString ? `?${queryString}` : ''}`;
  },
};

export default apiClient;
