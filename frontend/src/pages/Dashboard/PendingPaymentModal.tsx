// CSR26 Pending Payment Modal
// Modal for completing payment on pending transactions
// RULE: Use HTML + Tailwind for layout, MUI only for interactive components

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { paymentApi } from '../../api/apiClient';
import { formatEUR, formatWeightKg } from '../../utils/formatters';
import type { TransactionWithRelations } from '../../types';

// Initialize Stripe with public key from env
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '');

interface PaymentFormProps {
  clientSecret: string;
  amount: number;
  transactionId: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

// Inner form component that uses Stripe hooks
const PaymentForm = ({ clientSecret, amount, transactionId, onSuccess, onError }: PaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message || 'Payment validation failed');
        setProcessing(false);
        return;
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard`,
        },
        redirect: 'if_required',
      });

      if (confirmError) {
        setError(confirmError.message || 'Payment failed');
        onError(confirmError.message || 'Payment failed');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Call backend to confirm and sync transaction data
        try {
          const confirmResponse = await paymentApi.confirmPayment(transactionId);
          if (confirmResponse.data.data.status === 'COMPLETED') {
            onSuccess();
          } else if (confirmResponse.data.data.status === 'PROCESSING') {
            // Payment still processing, wait a bit and try again
            setError('Payment is processing. Please wait...');
            setTimeout(async () => {
              try {
                const retryResponse = await paymentApi.confirmPayment(transactionId);
                if (retryResponse.data.data.status === 'COMPLETED') {
                  onSuccess();
                } else {
                  setError('Payment confirmation pending. Please refresh in a moment.');
                }
              } catch {
                onSuccess(); // Proceed anyway, webhook will handle it
              }
            }, 2000);
          } else {
            setError(confirmResponse.data.data.message || 'Payment confirmation failed');
          }
        } catch (confirmErr) {
          // If confirmation fails, still proceed - webhook will handle it
          console.warn('Payment confirmation call failed, proceeding anyway:', confirmErr);
          onSuccess();
        }
      } else if (paymentIntent && paymentIntent.status === 'requires_action') {
        setError('Additional authentication required. Please complete the verification.');
      } else {
        setError('Payment processing. Please wait...');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert severity="error" className="mb-4">
          {error}
        </Alert>
      )}

      <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
        <PaymentElement
          options={{
            layout: 'tabs',
          }}
        />
      </div>

      <Button
        onClick={handleSubmit}
        variant="contained"
        fullWidth
        size="large"
        disabled={!stripe || !elements || processing}
        sx={{
          py: 1.5,
          textTransform: 'none',
          fontSize: '1rem',
        }}
      >
        {processing ? (
          <div className="flex items-center gap-2">
            <CircularProgress size={20} color="inherit" />
            <span>Processing Payment...</span>
          </div>
        ) : (
          `Pay ${formatEUR(amount)}`
        )}
      </Button>

      <p className="text-xs text-gray-500 text-center mt-2">
        Your payment is secured by Stripe. We never store your card details.
      </p>
    </div>
  );
};

interface PendingPaymentModalProps {
  open: boolean;
  transaction: TransactionWithRelations | null;
  onClose: () => void;
  onSuccess: () => void;
}

const PendingPaymentModal = ({
  open,
  transaction,
  onClose,
  onSuccess,
}: PendingPaymentModalProps) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch payment intent when modal opens with a transaction
  useEffect(() => {
    const fetchPaymentIntent = async () => {
      if (!transaction || !open) return;

      setLoading(true);
      setError(null);
      setClientSecret(null);

      try {
        const response = await paymentApi.resumePayment(transaction.id);
        setClientSecret(response.data.data.clientSecret);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize payment';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentIntent();
  }, [transaction, open]);

  const handleSuccess = () => {
    onSuccess();
    onClose();
  };

  const handleError = (errorMsg: string) => {
    setError(errorMsg);
  };

  if (!transaction) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: '8px' },
      }}
    >
      <DialogTitle>
        <div className="flex items-center justify-between">
          <span className="text-xl font-semibold text-gray-800">
            Complete Payment
          </span>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{ color: 'gray' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </IconButton>
        </div>
      </DialogTitle>

      <DialogContent>
        {/* Transaction Summary */}
        <div className="mb-6 p-4 bg-blue-50 rounded-md border border-blue-100">
          <h4 className="text-sm font-medium text-blue-800 mb-3">Transaction Details</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-blue-600">Amount</p>
              <p className="text-lg font-bold text-blue-900">{formatEUR(transaction.amount)}</p>
            </div>
            <div>
              <p className="text-xs text-blue-600">Environmental Impact</p>
              <p className="text-lg font-bold text-green-600">{formatWeightKg(transaction.impactKg)}</p>
            </div>
          </div>
          <p className="text-xs text-blue-600 mt-3">
            Complete this payment to finalize your environmental contribution.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-8">
            <CircularProgress size={40} />
            <p className="mt-4 text-gray-600">Initializing secure payment...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="space-y-4">
            <Alert severity="error">{error}</Alert>
            <Button
              onClick={onClose}
              variant="outlined"
              fullWidth
              sx={{ textTransform: 'none' }}
            >
              Close
            </Button>
          </div>
        )}

        {/* Payment Form */}
        {clientSecret && !loading && !error && (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: 'stripe',
                variables: {
                  colorPrimary: '#1976d2',
                  borderRadius: '6px',
                },
              },
            }}
          >
            <PaymentForm
              clientSecret={clientSecret}
              amount={transaction.amount}
              transactionId={transaction.id}
              onSuccess={handleSuccess}
              onError={handleError}
            />
          </Elements>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PendingPaymentModal;
