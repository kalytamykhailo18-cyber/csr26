// CSR26 Frontend Types
// Types MUST match: DB → Backend → Redux → Component
// These types mirror the backend types for end-to-end type safety

// ============================================
// ENUMS AS STRING UNIONS (compatible with erasableSyntaxOnly)
// ============================================

export type UserStatus = 'ACCUMULATION' | 'CERTIFIED';
export const UserStatus = {
  ACCUMULATION: 'ACCUMULATION' as const,
  CERTIFIED: 'CERTIFIED' as const,
};

export type PaymentMode = 'CLAIM' | 'PAY' | 'GIFT_CARD' | 'ALLOCATION';
export const PaymentMode = {
  CLAIM: 'CLAIM' as const,
  PAY: 'PAY' as const,
  GIFT_CARD: 'GIFT_CARD' as const,
  ALLOCATION: 'ALLOCATION' as const,
};

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED';
export const PaymentStatus = {
  PENDING: 'PENDING' as const,
  COMPLETED: 'COMPLETED' as const,
  FAILED: 'FAILED' as const,
};

export type GiftCodeStatus = 'UNUSED' | 'USED' | 'DEACTIVATED';
export const GiftCodeStatus = {
  UNUSED: 'UNUSED' as const,
  USED: 'USED' as const,
  DEACTIVATED: 'DEACTIVATED' as const,
};

export type UserRole = 'USER' | 'MERCHANT' | 'ADMIN';
export const UserRole = {
  USER: 'USER' as const,
  MERCHANT: 'MERCHANT' as const,
  ADMIN: 'ADMIN' as const,
};

// ============================================
// DATABASE MODELS (match Prisma models)
// ============================================

export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  dateOfBirth: string | null; // ISO date string
  street: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  state: string | null;
  role: UserRole;
  walletBalance: number;    // Decimal from backend
  walletImpactKg: number;   // Decimal from backend
  status: UserStatus;
  corsairExported: boolean;
  corsairId: string | null;
  createdAt: string;        // ISO date string
  updatedAt: string;        // ISO date string
}

export interface Transaction {
  id: string;
  userId: string;
  skuCode: string | null;
  amount: number;           // Decimal from backend
  impactKg: number;         // Decimal from backend
  paymentMode: PaymentMode;
  paymentStatus: PaymentStatus;
  stripePaymentId: string | null;
  masterId: string;
  partnerId: string | null;
  merchantId: string | null;
  giftCodeUsed: string | null;
  weightGrams: number | null;
  multiplier: number | null;
  createdAt: string;        // ISO date string
}

export interface Sku {
  code: string;
  name: string;
  description: string | null;
  paymentMode: PaymentMode;
  price: number;            // Decimal from backend
  weightGrams: number | null;
  multiplier: number;
  paymentRequired: boolean;
  validationRequired: boolean;
  active: boolean;
  merchantId: string | null;
  createdAt: string;        // ISO date string
  updatedAt: string;        // ISO date string
  merchant?: MerchantBasic | null;
}

export interface GiftCode {
  code: string;
  skuCode: string;
  status: GiftCodeStatus;
  usedByUserId: string | null;
  usedAt: string | null;    // ISO date string
  createdAt: string;        // ISO date string
}

export interface Merchant {
  id: string;
  name: string;
  email: string;
  multiplier: number;
  pricePerKg: number | null;
  monthlyBilling: boolean;
  currentBalance: number;   // Decimal from backend
  lastBillingDate: string | null;
  stripeAccountId: string | null;
  partnerId: string | null;
  createdAt: string;        // ISO date string
  updatedAt: string;        // ISO date string
}

export interface MerchantBasic {
  id: string;
  name: string;
  multiplier?: number;
}

export interface Invoice {
  id: string;
  merchantId: string;
  periodStart: string;      // ISO date string
  periodEnd: string;        // ISO date string
  transactionCount: number;
  totalImpactKg: number;    // Decimal from backend
  amount: number;           // Decimal from backend
  paid: boolean;
  paidAt: string | null;    // ISO date string
  stripePaymentId: string | null;
  createdAt: string;        // ISO date string
}

export interface Setting {
  key: string;
  value: string;
  description: string | null;
  updatedAt: string;        // ISO date string
}

export interface MagicLink {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;        // ISO date string
  used: boolean;
  createdAt: string;        // ISO date string
}

// ============================================
// API RESPONSE TYPES
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
// AUTH TYPES
// ============================================

export interface LoginRequest {
  email: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface RegisterRequest {
  email: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  street?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  state?: string;
}

// ============================================
// LANDING PAGE TYPES (6 Cases A-F)
// ============================================

// URL Parameters from landing page
export interface LandingParams {
  sku?: string;        // SKU code
  amount?: number;     // Pre-set amount (for funded/allocation)
  merchant?: string;   // Merchant identifier
  partner?: string;    // Partner identifier
  name?: string;       // Pre-filled name (from allocation)
  email?: string;      // Pre-filled email (from allocation)
  weight?: number;     // Dynamic weight in grams (e-commerce)
  multiplier?: number; // Multiplier override
}

// Form data from landing page - matches all 6 cases
export interface LandingFormData {
  // Minimal (CLAIM below €10) - Case A, B
  email: string;

  // Standard (PAY, ALLOCATION below €10) - Case C, E
  firstName?: string;
  lastName?: string;

  // Full (GIFT_CARD, €10+ threshold) - Case D, all €10+
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

// Determines which form to show based on case
export type LandingCase = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export interface LandingPageState {
  case: LandingCase;
  sku: Sku | null;
  params: LandingParams;
  amount: number;
  impact: ImpactCalculation | null;
  formType: 'minimal' | 'standard' | 'full';
  showPayment: boolean;
  showGiftCodeInput: boolean;
}

// ============================================
// TRANSACTION TYPES
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
  email: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  street?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  state?: string;
}

export interface TransactionWithRelations extends Transaction {
  user?: User;
  sku?: Sku | null;
  merchant?: Merchant | null;
}

export interface TransactionListResponse {
  transactions: TransactionWithRelations[];
  total: number;
}

// ============================================
// WALLET TYPES
// ============================================

export interface WalletSummary {
  balance: number;            // Total EUR
  impactKg: number;           // Total kg removed
  maturedImpactKg: number;    // Impact that has matured (available now)
  pendingImpactKg: number;    // Impact still in maturation
  bottles: number;            // Equivalent plastic bottles
  status: UserStatus;
  transactionCount: number;
  thresholdProgress: number;  // Percentage to €10 threshold (0-100)
  upcomingMaturations?: Array<{
    amount: number;
    date: string;
  }>;
}

// ============================================
// GIFT CODE TYPES
// ============================================

export interface ValidateGiftCodeRequest {
  code: string;
  skuCode: string;
}

export interface ValidateGiftCodeResponse {
  valid: boolean;
  amount?: number;
  impactKg?: number;
  impactDisplay?: string;
  message?: string;
}

export interface BatchUploadGiftCodesRequest {
  skuCode: string;
  codes: string[];
}

// ============================================
// MERCHANT TYPES
// ============================================

export interface MerchantSummary {
  id: string;
  name: string;
  multiplier: number;
  transactionCount: number;
  totalImpactKg: number;
  currentBalance: number;
  nextBillingDate: string | null;
}

export interface MerchantBillingInfo {
  currentBalance: number;
  pendingTransactions: number;
  nextBillingDate: string | null;
  lastBillingDate: string | null;
  invoices: Invoice[];
}

export interface MerchantWithCounts extends Merchant {
  _count?: {
    transactions: number;
    skus: number;
  };
}

// ============================================
// SETTINGS TYPES
// ============================================

// Known setting keys
export const SettingKey = {
  PRICE_PER_KG: 'PRICE_PER_KG',
  CERTIFICATION_THRESHOLD: 'CERTIFICATION_THRESHOLD',
  DEFAULT_MULTIPLIER: 'DEFAULT_MULTIPLIER',
  MONTHLY_BILLING_MINIMUM: 'MONTHLY_BILLING_MINIMUM',
} as const;

export type SettingKeyType = typeof SettingKey[keyof typeof SettingKey];

export interface SettingsMap {
  PRICE_PER_KG: string;
  CERTIFICATION_THRESHOLD: string;
  DEFAULT_MULTIPLIER: string;
  MONTHLY_BILLING_MINIMUM: string;
  [key: string]: string;
}

export interface UpdateSettingRequest {
  value: string;
  description?: string;
}

// ============================================
// IMPACT CALCULATION TYPES
// ============================================

export interface ImpactCalculation {
  amount: number;
  impactKg: number;
  impactGrams: number;
  displayValue: string;      // "450g" or "9.09 kg"
  belowThreshold: boolean;
  thresholdProgress: number; // 0-100
}

// ============================================
// PAYMENT TYPES (Stripe)
// ============================================

export interface CreatePaymentIntentRequest {
  amount: number;
  skuCode?: string;
  email: string;
}

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  transactionId?: string; // Returned by createIntent, used for confirmPayment
}

// ============================================
// UI STATE TYPES
// ============================================

export interface UIState {
  loading: boolean;
  error: string | null;
}

// ============================================
// COUNTRY LIST (for dropdowns)
// ============================================

export interface Country {
  code: string;
  name: string;
}

export const COUNTRIES: Country[] = [
  { code: 'IT', name: 'Italy' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AT', name: 'Austria' },
  { code: 'BE', name: 'Belgium' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'PT', name: 'Portugal' },
  { code: 'PL', name: 'Poland' },
  { code: 'GR', name: 'Greece' },
  { code: 'SE', name: 'Sweden' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'NO', name: 'Norway' },
  { code: 'IE', name: 'Ireland' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'RO', name: 'Romania' },
  { code: 'HU', name: 'Hungary' },
];

// ============================================
// USER ADMIN TYPES
// ============================================

export interface UserWithCounts extends User {
  _count?: {
    transactions: number;
  };
}

export interface UserWithTransactions extends User {
  transactions?: TransactionWithRelations[];
  _count?: {
    transactions: number;
  };
}

export interface UserListResponse {
  users: UserWithCounts[];
  total: number;
  limit: number;
  offset: number;
}
