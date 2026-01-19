// CSR26 Loading Spinner Component
// RULE: Each page shows inline spinner, NOT global overlay
// This component should be used within each page, not in MainLayout

import CircularProgress from '@mui/material/CircularProgress';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
  fullPage?: boolean;
  message?: string;
}

const sizeMap = {
  small: 24,
  medium: 40,
  large: 56,
};

const LoadingSpinner = ({
  size = 'medium',
  className = '',
  fullPage = false,
  message,
}: LoadingSpinnerProps) => {
  if (fullPage) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-[400px] ${className}`}>
        <CircularProgress size={sizeMap[size]} sx={{ color: '#1a1a2e' }} />
        {message && (
          <p className="mt-4 text-gray-600 text-sm animate-fade-up">{message}</p>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center p-4 ${className}`}>
      <CircularProgress size={sizeMap[size]} sx={{ color: '#1a1a2e' }} />
      {message && (
        <span className="ml-3 text-gray-600 text-sm">{message}</span>
      )}
    </div>
  );
};

export default LoadingSpinner;
