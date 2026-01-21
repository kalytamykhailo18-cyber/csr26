// CSR26 Transaction List Component
// Displays user's transaction history with ability to pay pending transactions
// RULE: Use HTML + Tailwind for layout, MUI only for interactive components

import Button from '@mui/material/Button';
import type { TransactionWithRelations } from '../../types';
import {
  formatEUR,
  formatWeightKg,
  formatDate,
  formatPaymentStatus,
  formatPaymentMode,
} from '../../utils/formatters';

interface TransactionListProps {
  transactions: TransactionWithRelations[];
  onPayNow?: (transaction: TransactionWithRelations) => void;
}

const TransactionList = ({ transactions, onPayNow }: TransactionListProps) => {
  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-md border border-gray-200 p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-800 mb-2">
          No Transactions Yet
        </h3>
        <p className="text-gray-500">
          Start your environmental journey by making your first contribution.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">Transaction History</h3>
        <p className="text-sm text-gray-500">
          {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Impact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Merchant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((transaction) => {
              const statusInfo = formatPaymentStatus(transaction.paymentStatus);
              return (
                <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatDate(transaction.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                    {formatPaymentMode(transaction.paymentMode)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                    {formatEUR(transaction.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    {formatWeightKg(transaction.impactKg)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {transaction.merchant?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-md ${
                          statusInfo.color === 'success'
                            ? 'bg-green-100 text-green-800'
                            : statusInfo.color === 'warning'
                            ? 'bg-yellow-100 text-yellow-800'
                            : statusInfo.color === 'error'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {statusInfo.text}
                      </span>
                      {transaction.paymentStatus === 'PENDING' && onPayNow && (
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => onPayNow(transaction)}
                          sx={{
                            textTransform: 'none',
                            fontSize: '0.75rem',
                            py: 0.5,
                            px: 1.5,
                            minWidth: 'auto',
                          }}
                        >
                          Pay Now
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-gray-200">
        {transactions.map((transaction) => {
          const statusInfo = formatPaymentStatus(transaction.paymentStatus);
          return (
            <div key={transaction.id} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">
                  {formatDate(transaction.createdAt)}
                </span>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-medium rounded-md ${
                    statusInfo.color === 'success'
                      ? 'bg-green-100 text-green-800'
                      : statusInfo.color === 'warning'
                      ? 'bg-yellow-100 text-yellow-800'
                      : statusInfo.color === 'error'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {statusInfo.text}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {formatPaymentMode(transaction.paymentMode)}
                  </p>
                  {transaction.merchant && (
                    <p className="text-xs text-gray-500">{transaction.merchant.name}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-800">
                    {formatEUR(transaction.amount)}
                  </p>
                  <p className="text-sm font-medium text-green-600">
                    {formatWeightKg(transaction.impactKg)}
                  </p>
                </div>
              </div>
              {/* Pay Now button for pending transactions */}
              {transaction.paymentStatus === 'PENDING' && onPayNow && (
                <div className="mt-3">
                  <Button
                    variant="contained"
                    size="small"
                    fullWidth
                    onClick={() => onPayNow(transaction)}
                    sx={{
                      textTransform: 'none',
                    }}
                  >
                    Pay Now - {formatEUR(transaction.amount)}
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TransactionList;
