// CSR26 Merchant Billing Section Component
// Displays billing info and invoices for merchants
// RULE: Use HTML + Tailwind for layout, MUI only for interactive components

import { useState } from 'react';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import type { MerchantBillingInfo } from '../../types';
import { formatEUR, formatDate } from '../../utils/formatters';

interface BillingSectionProps {
  billing: MerchantBillingInfo;
  onPayNow?: (amount: number) => void;
}

const BillingSection = ({ billing, onPayNow }: BillingSectionProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handlePayNow = async () => {
    setIsProcessing(true);
    setPaymentStatus('idle');

    try {
      // In production, this would integrate with Stripe
      // For now, show a message that payment processing will be available
      if (onPayNow) {
        onPayNow(billing.currentBalance);
      }

      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Show informational message
      setPaymentStatus('success');
    } catch {
      setPaymentStatus('error');
    } finally {
      setIsProcessing(false);
    }
  };
  return (
    <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">Billing Information</h3>
        <p className="text-sm text-gray-500">Monthly accumulated billing summary</p>
      </div>

      {/* Billing Summary */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Current Balance */}
          <div className="bg-gray-50 rounded-md p-4">
            <p className="text-sm text-gray-500 mb-1">Current Balance</p>
            <p className="text-2xl font-bold text-gray-800">
              {formatEUR(billing.currentBalance)}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {billing.pendingTransactions} pending transaction
              {billing.pendingTransactions !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Next Billing Date */}
          <div className="bg-gray-50 rounded-md p-4">
            <p className="text-sm text-gray-500 mb-1">Next Billing Date</p>
            <p className="text-2xl font-bold text-gray-800">
              {billing.nextBillingDate
                ? formatDate(billing.nextBillingDate)
                : 'Not scheduled'}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Monthly billing on the 1st
            </p>
          </div>

          {/* Last Billing */}
          <div className="bg-gray-50 rounded-md p-4">
            <p className="text-sm text-gray-500 mb-1">Last Billing Date</p>
            <p className="text-2xl font-bold text-gray-800">
              {billing.lastBillingDate
                ? formatDate(billing.lastBillingDate)
                : 'No billing yet'}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {billing.invoices.length} invoice
              {billing.invoices.length !== 1 ? 's' : ''} to date
            </p>
          </div>
        </div>

        {/* Payment Status Alerts */}
        {paymentStatus === 'success' && (
          <Alert severity="info" className="mt-6" onClose={() => setPaymentStatus('idle')}>
            Payment processing will be available soon. Your accumulated balance of {formatEUR(billing.currentBalance)} will be charged automatically on the next billing date, or you can contact support for manual processing.
          </Alert>
        )}
        {paymentStatus === 'error' && (
          <Alert severity="error" className="mt-6" onClose={() => setPaymentStatus('idle')}>
            Payment processing failed. Please try again or contact support.
          </Alert>
        )}

        {/* Pay Early Option */}
        {billing.currentBalance >= 10 && (
          <div className="mt-6 p-4 bg-blue-50 rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-blue-800">Pay Now Option</p>
              <p className="text-xs text-blue-600 mt-1">
                Your balance has reached the minimum threshold. You can pay now if you prefer.
              </p>
            </div>
            <Button
              variant="contained"
              size="small"
              onClick={handlePayNow}
              disabled={isProcessing}
              sx={{ textTransform: 'none', whiteSpace: 'nowrap' }}
            >
              {isProcessing ? 'Processing...' : `Pay ${formatEUR(billing.currentBalance)}`}
            </Button>
          </div>
        )}

        {/* How Billing Works */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-700 mb-3">How Billing Works</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                1
              </div>
              <div>
                <p className="font-medium text-gray-700">Accumulation</p>
                <p className="text-gray-500 text-xs">Small fees accumulate throughout the month</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                2
              </div>
              <div>
                <p className="font-medium text-gray-700">Monthly Invoice</p>
                <p className="text-gray-500 text-xs">Invoice generated on the 1st if balance &ge; €10</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                3
              </div>
              <div>
                <p className="font-medium text-gray-700">Single Charge</p>
                <p className="text-gray-500 text-xs">One monthly payment saves on processing fees</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Invoices */}
        {billing.invoices.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Invoices</h4>
            <div className="space-y-2">
              {billing.invoices.slice(0, 5).map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {formatDate(invoice.periodStart)} - {formatDate(invoice.periodEnd)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {invoice.transactionCount} transactions • {invoice.totalImpactKg.toFixed(2)} kg impact
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-800">
                      {formatEUR(invoice.amount)}
                    </p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-md ${
                        invoice.paid
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {invoice.paid ? 'Paid' : 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillingSection;
