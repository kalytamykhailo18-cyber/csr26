// CSR26 Formatter Utilities
// Formatting functions for display values

/**
 * Format currency value
 */
export const formatCurrency = (amount: number, currency: string = 'EUR'): string => {
  return new Intl.NumberFormat('en-EU', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format EUR specifically (most common case)
 */
export const formatEUR = (amount: number | string | null | undefined): string => {
  const num = Number(amount) || 0;
  return `€${num.toFixed(2)}`;
};

/**
 * Format weight in grams or kg based on size
 */
export const formatWeight = (grams: number): string => {
  if (grams < 1000) {
    return `${Math.round(grams)}g`;
  }
  return `${(grams / 1000).toFixed(2)} kg`;
};

/**
 * Format weight from kg
 */
export const formatWeightKg = (kg: number | string | null | undefined): string => {
  const num = Number(kg) || 0;
  const grams = num * 1000;
  if (grams < 1000) {
    return `${Math.round(grams)}g`;
  }
  return `${num.toFixed(2)} kg`;
};

/**
 * Format date as localized string
 */
export const formatDate = (dateString: string | Date, options?: Intl.DateTimeFormatOptions): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  return date.toLocaleDateString('en-GB', options || defaultOptions);
};

/**
 * Format date and time
 */
export const formatDateTime = (dateString: string | Date): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format date as relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (dateString: string | Date): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return 'Just now';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  }
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  }
  if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  }
  return formatDate(date);
};

/**
 * Format percentage
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Truncate text with ellipsis
 */
export const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
};

/**
 * Mask email for privacy (show first 2 chars + last part of domain)
 */
export const maskEmail = (email: string): string => {
  const [localPart, domain] = email.split('@');
  if (!domain) return email;
  const maskedLocal = localPart.slice(0, 2) + '***';
  return `${maskedLocal}@${domain}`;
};

/**
 * Format phone number
 */
export const formatPhone = (phone: string): string => {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');
  // Format based on length
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  return phone;
};

/**
 * Capitalize first letter
 */
export const capitalize = (text: string): string => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Convert enum value to display text
 */
export const enumToDisplay = (value: string): string => {
  return value
    .split('_')
    .map(word => capitalize(word))
    .join(' ');
};

/**
 * Format payment status for display
 */
export const formatPaymentStatus = (status: string): { text: string; color: 'success' | 'warning' | 'error' | 'default' } => {
  switch (status) {
    case 'COMPLETED':
      return { text: 'Completed', color: 'success' };
    case 'PENDING':
      return { text: 'Pending', color: 'warning' };
    case 'FAILED':
      return { text: 'Failed', color: 'error' };
    default:
      return { text: status, color: 'default' };
  }
};

/**
 * Format user status for display
 */
export const formatUserStatus = (status: string): { text: string; color: 'success' | 'warning' } => {
  switch (status) {
    case 'CERTIFIED':
      return { text: 'Certified Asset', color: 'success' };
    case 'ACCUMULATION':
      return { text: 'Accumulating', color: 'warning' };
    default:
      return { text: status, color: 'warning' };
  }
};

/**
 * Format payment mode for display
 */
export const formatPaymentMode = (mode: string): string => {
  switch (mode) {
    case 'CLAIM':
      return 'Claim';
    case 'PAY':
      return 'Payment';
    case 'GIFT_CARD':
      return 'Gift Card';
    case 'ALLOCATION':
      return 'Allocation';
    default:
      return mode;
  }
};

/**
 * Format number with thousands separator
 */
export const formatNumber = (num: number, decimals: number = 0): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

/**
 * Format file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};
