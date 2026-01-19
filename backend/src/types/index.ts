// CSR26 Backend Types
// Types must match: DB → Backend → Redux → Component

import type {
  User,
  Transaction,
  Sku,
  GiftCode,
  Merchant,
  Invoice,
  Setting,
  MagicLink,
  PaymentMode,
  PaymentStatus,
  UserStatus,
  GiftCodeStatus,
  UserRole,
} from '@prisma/client';

// Re-export Prisma types
export type {
  User,
  Transaction,
  Sku,
  GiftCode,
  Merchant,
  Invoice,
  Setting,
  MagicLink,
  PaymentMode,
  PaymentStatus,
  UserStatus,
  GiftCodeStatus,
  UserRole,
};

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

// ============================================
// Auth Types
// ============================================

export interface LoginRequest {
  email: string;
}

export interface VerifyTokenRequest {
  token: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// ============================================
// Landing Page Types (6 Cases)
// ============================================

// URL Parameters from landing page
export interface LandingParams {
  sku?: string;       // SKU code
  amount?: number;    // Pre-set amount (for funded/allocation)
  merchant?: string;  // Merchant identifier
  partner?: string;   // Partner identifier
  name?: string;      // Pre-filled name (from allocation)
  email?: string;     // Pre-filled email (from allocation)
  weight?: number;    // Dynamic weight in grams (e-commerce)
  multiplier?: number; // Multiplier override
}

// Form data from landing page
export interface LandingFormData {
  // Minimal (CLAIM below €10)
  email: string;

  // Standard (PAY, ALLOCATION below €10)
  firstName?: string;
  lastName?: string;

  // Full (GIFT_CARD, €10+ threshold)
  dateOfBirth?: string;
  street?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  state?: string;

  // Terms
  termsAccepted?: boolean;

  // Payment specific
  amount?: number;
  giftCode?: string;
}

// ============================================
// Transaction Types
// ============================================

export interface CreateTransactionRequest {
  skuCode?: string;
  amount: number;
  paymentMode: PaymentMode;
  giftCode?: string;
  merchantId?: string;
  partnerId?: string;
  weightGrams?: number;
  multiplier?: number;
}

export interface TransactionWithRelations extends Transaction {
  user?: User;
  sku?: Sku | null;
  merchant?: Merchant | null;
}

// ============================================
// Wallet Types
// ============================================

export interface WalletSummary {
  balance: number;      // Total EUR
  impactKg: number;     // Total kg removed
  status: UserStatus;
  transactionCount: number;
  thresholdProgress: number; // Percentage to €10 threshold
}

// ============================================
// Gift Code Types
// ============================================

export interface ValidateGiftCodeRequest {
  code: string;
  skuCode: string;
}

export interface ValidateGiftCodeResponse {
  valid: boolean;
  amount?: number;
  impactKg?: number;
  message?: string;
}

export interface BatchUploadGiftCodesRequest {
  skuCode: string;
  codes: string[];
}

// ============================================
// Merchant Types
// ============================================

export interface MerchantSummary {
  id: string;
  name: string;
  multiplier: number;
  transactionCount: number;
  totalImpactKg: number;
  currentBalance: number;
  nextBillingDate: Date | null;
}

export interface MerchantBillingInfo {
  currentBalance: number;
  pendingTransactions: number;
  nextBillingDate: Date | null;
  lastBillingDate: Date | null;
  invoices: Invoice[];
}

// ============================================
// Settings Types
// ============================================

export interface SettingsMap {
  PRICE_PER_KG: string;
  CERTIFICATION_THRESHOLD: string;
  DEFAULT_MULTIPLIER: string;
  MONTHLY_BILLING_MINIMUM: string;
  [key: string]: string;
}

export interface UpdateSettingRequest {
  key: string;
  value: string;
}

// ============================================
// Impact Calculation Types
// ============================================

export interface ImpactCalculation {
  amount: number;
  impactKg: number;
  impactGrams: number;
  displayValue: string; // "450g" or "9.09 kg"
  belowThreshold: boolean;
  thresholdProgress: number;
}

// ============================================
// Payment Types (Stripe)
// ============================================

export interface CreatePaymentIntentRequest {
  amount: number;
  skuCode?: string;
  email: string;
}

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}
