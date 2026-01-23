// CSR26 Stripe Payment Form Component
// Handles actual Stripe payment with PaymentElement
// DATA FLOW: User clicks Pay → Create Payment Intent → Show Stripe Form → Confirm → Confirm API → Update Wallet

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { paymentApi } from '../api/apiClient';
import { formatEUR } from '../utils/formatters';

// Initialize Stripe with public key from env
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '');

interface PaymentFormProps {
  clientSecret: string;
  amount: number;
  transactionId: string;
  onSuccess: (transactionId: string) => void;
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
        // Payment succeeded - confirm with backend to sync data
        try {
          const confirmResponse = await paymentApi.confirmPayment(transactionId);
          if (confirmResponse.data.data.status === 'COMPLETED') {
            onSuccess(transactionId);
          } else if (confirmResponse.data.data.status === 'PROCESSING') {
            // Payment still processing, wait a bit and try again
            setError('Payment is processing. Please wait...');
            setTimeout(async () => {
              try {
                const retryResponse = await paymentApi.confirmPayment(transactionId);
                if (retryResponse.data.data.status === 'COMPLETED') {
                  onSuccess(transactionId);
                } else {
                  // Proceed anyway, webhook will handle it
                  onSuccess(transactionId);
                }
              } catch {
                onSuccess(transactionId); // Proceed anyway, webhook will handle it
              }
            }, 2000);
          } else {
            // Proceed anyway, webhook will handle it
            onSuccess(transactionId);
          }
        } catch (confirmErr) {
          // If confirmation fails, still proceed - webhook will handle it
          console.warn('Payment confirmation call failed, proceeding anyway:', confirmErr);
          onSuccess(transactionId);
        }
      } else if (paymentIntent && paymentIntent.status === 'requires_action') {
        // 3D Secure or other action required - Stripe will handle redirect
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

interface StripePaymentFormProps {
  amount: number;
  email: string;
  skuCode?: string;
  onSuccess: (transactionId: string) => void;
  onError: (error: string) => void;
  onCancel?: () => void;
}

// Main component that creates payment intent and wraps with Elements
const StripePaymentForm = ({
  amount,
  email,
  skuCode,
  onSuccess,
  onError,
  onCancel,
}: StripePaymentFormProps) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const createIntent = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await paymentApi.createIntent({
          amount,
          email,
          skuCode,
        });
        if (!cancelled) {
          setClientSecret(response.data.data.clientSecret);
          setTransactionId(response.data.data.transactionId || '');
        }
      } catch (err) {
        if (!cancelled) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to initialize payment';
          setError(errorMessage);
          onError(errorMessage);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    if (amount > 0 && email) {
      createIntent();
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, email, skuCode]); // Removed onError to prevent re-initialization

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <CircularProgress size={40} />
        <p className="mt-4 text-gray-600">Initializing secure payment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert severity="error">{error}</Alert>
        {onCancel && (
          <Button
            onClick={onCancel}
            variant="outlined"
            fullWidth
            sx={{ textTransform: 'none' }}
          >
            Go Back
          </Button>
        )}
      </div>
    );
  }

  if (!clientSecret || !transactionId) {
    return (
      <Alert severity="error">
        Unable to initialize payment. Please try again.
      </Alert>
    );
  }

  return (
    <Elements
      key={clientSecret} // Force remount with new clientSecret
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
        amount={amount}
        transactionId={transactionId}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  );
};

export default StripePaymentForm;
