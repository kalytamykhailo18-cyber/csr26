// CSR26 Thank You Message Component
// Displays success message after form submission
// RULE: Use HTML + Tailwind for layout, MUI only for interactive components

import Button from '@mui/material/Button';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

interface ThankYouMessageProps {
  message: {
    title: string;
    message: string;
  };
  impact: {
    displayValue: string;
    impactKg: number;
  };
  onViewPortfolio: () => void;
}

const ThankYouMessage = ({ message, impact, onViewPortfolio }: ThankYouMessageProps) => {
  return (
    <div className="text-center py-8 animate-zoom-in-normal">
      {/* Success Icon */}
      <div className="flex justify-center mb-6">
        <CheckCircleOutlineIcon
          sx={{ fontSize: 80, color: 'success.main' }}
        />
      </div>

      {/* Title */}
      <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
        Thank You!
      </h2>

      {/* Impact Display */}
      <div className="bg-green-50 rounded-md py-6 px-4 mb-6">
        <p className="text-lg text-gray-700 mb-2">You have helped remove</p>
        <p className="text-4xl md:text-5xl font-bold text-green-600 mb-2">
          {impact.displayValue}
        </p>
        <p className="text-lg text-gray-700">of plastic from the environment</p>
      </div>

      {/* Message */}
      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        {message.message}
      </p>

      {/* View Portfolio Button */}
      <Button
        variant="contained"
        size="large"
        onClick={onViewPortfolio}
        sx={{
          px: 4,
          py: 1.5,
          textTransform: 'none',
          fontSize: '1rem',
        }}
      >
        View Your Portfolio
      </Button>
    </div>
  );
};

export default ThankYouMessage;
