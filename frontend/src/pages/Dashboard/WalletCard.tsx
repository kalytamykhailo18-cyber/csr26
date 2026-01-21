// CSR26 Wallet Card Component
// Displays user's wallet balance and impact with maturation data
// RULE: Use HTML + Tailwind for layout, MUI only for interactive components

import type { UserStatus } from '../../types';
import { formatEUR, formatWeightKg, formatUserStatus } from '../../utils/formatters';

interface WalletCardProps {
  balance: number;
  impactKg: number;
  maturedImpactKg: number;
  pendingImpactKg: number;
  bottles: number;
  status: UserStatus;
  transactionCount: number;
}

// Bottle SVG component for visual representation
const BottleIcon = ({ filled = false }: { filled?: boolean }) => (
  <svg
    viewBox="0 0 24 36"
    className={`w-3 h-5 ${filled ? 'text-blue-500' : 'text-gray-200'}`}
    fill="currentColor"
  >
    <path d="M8 0h8v4h-2v2h3a3 3 0 013 3v24a3 3 0 01-3 3H7a3 3 0 01-3-3V9a3 3 0 013-3h3V4H8V0z" />
  </svg>
);

const WalletCard = ({
  balance,
  impactKg: _impactKg, // Total impact, used by parent for calculations
  maturedImpactKg,
  pendingImpactKg,
  bottles,
  status,
  transactionCount,
}: WalletCardProps) => {
  const statusInfo = formatUserStatus(status);

  // Calculate display bottles (max 50 for visual representation)
  const displayBottles = Math.min(bottles, 50);
  const showOverflow = bottles > 50;

  return (
    <div className="bg-white rounded-md border border-gray-200 p-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Balance Section */}
        <div className="text-center md:text-left">
          <p className="text-sm text-gray-500 mb-1">Total Balance</p>
          <p className="text-3xl font-bold text-gray-800">
            {formatEUR(balance)}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {transactionCount} transaction{transactionCount !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Matured Impact Section */}
        <div className="text-center md:text-left">
          <p className="text-sm text-gray-500 mb-1">Matured Impact</p>
          <p className="text-3xl font-bold text-green-600">
            {formatWeightKg(maturedImpactKg)}
          </p>
          <p className="text-sm text-green-600 mt-2">
            Available now (5% released)
          </p>
        </div>

        {/* Pending Impact Section */}
        <div className="text-center md:text-left">
          <p className="text-sm text-gray-500 mb-1">Pending Maturation</p>
          <p className="text-3xl font-bold text-yellow-600">
            {formatWeightKg(pendingImpactKg)}
          </p>
          <p className="text-sm text-yellow-600 mt-2">
            Maturing over 80 weeks
          </p>
        </div>

        {/* Status Section */}
        <div className="text-center md:text-left">
          <p className="text-sm text-gray-500 mb-1">Status</p>
          <span
            className={`inline-block px-3 py-1 rounded-md text-sm font-medium ${
              statusInfo.color === 'success'
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {statusInfo.text}
          </span>
          <p className="text-sm text-gray-500 mt-2">
            {status === 'CERTIFIED'
              ? 'Auditable and guaranteed'
              : 'Building towards certification'}
          </p>
        </div>
      </div>

      {/* Bottle Visualization Section */}
      {bottles > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-100">
          <div className="text-center mb-4">
            <p className="text-sm font-medium text-gray-700">
              Your Impact Visualized
            </p>
            <p className="text-2xl font-bold text-blue-600">
              {bottles.toLocaleString()} plastic bottles
            </p>
            <p className="text-xs text-gray-500">
              removed from the environment
            </p>
          </div>

          {/* Bottle Grid Visualization */}
          <div className="flex flex-wrap justify-center gap-1 max-w-md mx-auto">
            {Array.from({ length: displayBottles }).map((_, i) => (
              <BottleIcon key={i} filled={true} />
            ))}
            {showOverflow && (
              <span className="flex items-center text-sm text-blue-600 font-medium ml-2">
                +{(bottles - 50).toLocaleString()} more
              </span>
            )}
          </div>

          {/* Impact Equivalence */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              1 kg of plastic = ~25 plastic bottles
            </p>
          </div>
        </div>
      )}

      {/* Maturation Timeline Preview */}
      {pendingImpactKg > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">5% Now</span>
            </div>
            <div className="flex-1 h-1 bg-gray-200 mx-4 rounded">
              <div className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-blue-500 rounded" style={{ width: '5%' }}></div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-gray-600">45% @ 40wk</span>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600">50% @ 80wk</span>
            </div>
          </div>
        </div>
      )}

      {/* CPRS Protocol Info with Certification Badges */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500 text-center md:text-left">
            Your impact is tracked and verified through the CPRS protocol by Corsair Connect.
          </p>
          {/* Certification Badges Placeholder */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Control Union
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Corsair
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletCard;
