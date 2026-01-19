// CSR26 Wallet Card Component
// Displays user's wallet balance and impact
// RULE: Use HTML + Tailwind for layout, MUI only for interactive components

import type { UserStatus } from '../../types';
import { formatEUR, formatWeightKg, formatUserStatus } from '../../utils/formatters';

interface WalletCardProps {
  balance: number;
  impactKg: number;
  status: UserStatus;
  transactionCount: number;
}

const WalletCard = ({ balance, impactKg, status, transactionCount }: WalletCardProps) => {
  const statusInfo = formatUserStatus(status);

  return (
    <div className="bg-white rounded-md border border-gray-200 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        {/* Balance Section */}
        <div className="flex-1">
          <p className="text-sm text-gray-500 mb-1">Total Balance</p>
          <p className="text-3xl md:text-4xl font-bold text-gray-800">
            {formatEUR(balance)}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {transactionCount} transaction{transactionCount !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px h-20 bg-gray-200" />

        {/* Impact Section */}
        <div className="flex-1">
          <p className="text-sm text-gray-500 mb-1">Environmental Impact</p>
          <p className="text-3xl md:text-4xl font-bold text-green-600">
            {formatWeightKg(impactKg)}
          </p>
          <p className="text-sm text-gray-500 mt-2">of plastic removed</p>
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px h-20 bg-gray-200" />

        {/* Status Section */}
        <div className="flex-1">
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

      {/* CPRS Protocol Info */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500 text-center">
          Your impact is tracked and verified through the CPRS protocol by Corsair Connect.
        </p>
      </div>
    </div>
  );
};

export default WalletCard;
