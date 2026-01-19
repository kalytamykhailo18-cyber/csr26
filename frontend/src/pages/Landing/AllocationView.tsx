// CSR26 Allocation View Component
// For Case E: ALLOCATION mode (e-commerce integration)
// RULE: No form needed - data comes from URL parameters
// RULE: Use HTML + Tailwind for layout, MUI only for interactive components

import Button from '@mui/material/Button';
import NatureIcon from '@mui/icons-material/Nature';
import type { LandingParams } from '../../types';

interface AllocationViewProps {
  params: LandingParams;
  impact: {
    displayValue: string;
    impactKg: number;
  };
  message: {
    title: string;
    message: string;
  };
  onViewPortfolio: () => void;
  isAuthenticated: boolean;
}

const AllocationView = ({
  params,
  impact,
  message: _message, // Currently unused but passed for consistency
  onViewPortfolio,
  isAuthenticated: _isAuthenticated, // Currently unused but may be used for conditional rendering
}: AllocationViewProps) => {
  // Extract name from params or use generic greeting
  const customerName = params.name || 'Valued Customer';
  const firstName = customerName.split(' ')[0];

  return (
    <div className="text-center py-8">
      {/* Eco Icon */}
      <div className="flex justify-center mb-6 animate-zoom-in-fast">
        <div className="bg-green-100 rounded-full p-6">
          <NatureIcon sx={{ fontSize: 64, color: 'success.main' }} />
        </div>
      </div>

      {/* Personalized Greeting */}
      <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4 animate-fade-down-normal">
        Thank You, {firstName}!
      </h2>

      {/* Impact Display */}
      <div className="bg-green-50 rounded-md py-6 px-4 mb-6 animate-zoom-in-normal">
        <p className="text-lg text-gray-700 mb-2">With this purchase, you just removed</p>
        <p className="text-4xl md:text-5xl font-bold text-green-600 mb-2">
          {impact.displayValue}
        </p>
        <p className="text-lg text-gray-700">of plastic from the environment</p>
      </div>

      {/* Progress Bar Section */}
      <div className="bg-white rounded-md border border-gray-200 p-6 mb-6 animate-fade-up-light-slow">
        <p className="text-sm text-gray-600 mb-3">Your Growing Impact</p>

        {/* Simple Progress Visualization */}
        <div className="relative pt-1">
          <div className="flex mb-2 items-center justify-between">
            <div>
              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-md text-green-600 bg-green-100">
                Environmental Impact
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold inline-block text-green-600">
                {impact.displayValue}
              </span>
            </div>
          </div>
          <div className="overflow-hidden h-3 text-xs flex rounded-md bg-gray-200">
            <div
              style={{ width: '100%' }}
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500 transition-all duration-500"
            />
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-3">
          Every purchase adds to your environmental portfolio
        </p>
      </div>

      {/* Attribution Info */}
      {(params.partner || params.merchant) && (
        <div className="text-sm text-gray-500 mb-6 animate-fade-up-slow">
          <p>
            This environmental allocation was made possible through{' '}
            <span className="font-medium text-gray-700">
              {params.partner || params.merchant}
            </span>
          </p>
        </div>
      )}

      {/* Message */}
      <p className="text-gray-600 mb-8 max-w-md mx-auto animate-fade-up-normal">
        Your contribution is now part of the certified plastic removal process.
        Track your growing impact in your personal portfolio.
      </p>

      {/* View Portfolio Button */}
      <div className="animate-fade-up-light-slow">
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

      {/* Additional Info */}
      <div className="mt-8 pt-6 border-t border-gray-200 animate-fade-up-slow">
        <p className="text-xs text-gray-500">
          Your environmental allocation is tracked and verified through the CPRS protocol.
          <br />
          All credits follow the industrial 80-week processing cycle for certified removal.
        </p>
      </div>
    </div>
  );
};

export default AllocationView;
