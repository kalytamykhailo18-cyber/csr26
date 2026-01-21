// CSR26 Landing Page
// Main landing page that handles all 6 cases (A-F)
// DATA FLOW: URL params → Redux fetch SKU/settings → Calculate case → Show form → Submit → API → Redirect

import { useEffect, useMemo, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchSkuByCode, clearCurrentSku } from '../../store/slices/skuSlice';
import { registerUser } from '../../store/slices/authSlice';
import { createTransaction } from '../../store/slices/transactionSlice';
import { validateGiftCode } from '../../store/slices/giftCodeSlice';
import { useNavigation } from '../../hooks/useNavigation';
import type { LandingParams, LandingFormData, LandingCase, PaymentMode } from '../../types';
import {
  determineLandingCase,
  determineFormType,
  calculateImpact,
  calculateAmount,
  getLandingMessage,
  calculateWeightBasedImpact,
} from '../../utils/calculations';

// Components
import Navigation from '../../components/Navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import ProtocolBlock from '../../components/ProtocolBlock';
import LoadingSpinner from '../../components/LoadingSpinner';
import ClaimForm from './ClaimForm';
import PayForm from './PayForm';
import GiftCardForm from './GiftCardForm';
import AllocationView from './AllocationView';
import GeneralForm from './GeneralForm';
import ThankYouMessage from './ThankYouMessage';

const LandingPage = () => {
  const dispatch = useAppDispatch();
  const { goToDashboard } = useNavigation();
  const [searchParams] = useSearchParams();

  // Redux state
  const { currentSku, loading: skuLoading } = useAppSelector((state) => state.sku);
  const { pricePerKg, certificationThreshold, loading: settingsLoading } = useAppSelector(
    (state) => state.settings
  );
  const { loading: authLoading, isAuthenticated } = useAppSelector((state) => state.auth);
  const { loading: transactionLoading } = useAppSelector((state) => state.transaction);
  const { loading: giftCodeLoading, validationResult } = useAppSelector((state) => state.giftCode);

  // Local state
  const [submitted, setSubmitted] = useState(false);
  const submittedRef = useRef(false); // Use ref to persist across re-renders
  const [giftCodeValidated, setGiftCodeValidated] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // Parse URL parameters
  const params: LandingParams = useMemo(() => ({
    sku: searchParams.get('sku') || undefined,
    amount: searchParams.get('amount') ? Number(searchParams.get('amount')) : undefined,
    merchant: searchParams.get('merchant') || undefined,
    partner: searchParams.get('partner') || undefined,
    name: searchParams.get('name') || undefined,
    email: searchParams.get('email') || undefined,
    weight: searchParams.get('weight') ? Number(searchParams.get('weight')) : undefined,
    multiplier: searchParams.get('multiplier') ? Number(searchParams.get('multiplier')) : undefined,
  }), [searchParams]);

  // Fetch SKU on mount if provided
  useEffect(() => {
    if (params.sku) {
      dispatch(fetchSkuByCode(params.sku));
    }
    return () => {
      dispatch(clearCurrentSku());
    };
  }, [dispatch, params.sku]);

  // Determine the landing case
  const landingCase: LandingCase = useMemo(() => {
    return determineLandingCase(currentSku, params);
  }, [currentSku, params]);

  // Calculate amount based on SKU, params, and user selection
  const amount = useMemo(() => {
    if (selectedAmount > 0) {
      return selectedAmount;
    }
    return calculateAmount(currentSku, params, pricePerKg);
  }, [currentSku, params, pricePerKg, selectedAmount]);

  // Calculate impact
  const impact = useMemo(() => {
    // Weight-based calculation for CLAIM products
    if (currentSku?.weightGrams && currentSku.weightGrams > 0) {
      const multiplier = params.multiplier || currentSku.multiplier || 1;
      return calculateWeightBasedImpact(currentSku.weightGrams, multiplier, pricePerKg);
    }
    // Dynamic weight from URL
    if (params.weight && params.weight > 0) {
      const multiplier = params.multiplier || 1;
      return calculateWeightBasedImpact(params.weight, multiplier, pricePerKg);
    }
    // Amount-based calculation
    return calculateImpact(amount, pricePerKg, certificationThreshold);
  }, [currentSku, params, amount, pricePerKg, certificationThreshold]);

  // Determine form type
  const formType = useMemo(() => {
    return determineFormType(landingCase, amount, certificationThreshold);
  }, [landingCase, amount, certificationThreshold]);

  // Get dynamic message
  const message = useMemo(() => {
    return getLandingMessage(
      landingCase,
      amount,
      impact.displayValue,
      certificationThreshold
    );
  }, [landingCase, amount, impact.displayValue, certificationThreshold]);

  // Auto-create transaction for Case E (ALLOCATION) - data comes from URL
  useEffect(() => {
    const createAllocationTransaction = async () => {
      // Only for Case E with email from URL - check both state and ref to prevent duplicates
      if (landingCase !== 'E' || !params.email || submitted || submittedRef.current) return;

      // Wait for settings to load
      if (settingsLoading || amount <= 0) return;

      // Mark as submitted immediately to prevent race conditions
      submittedRef.current = true;

      try {
        // Register/find user first
        const registerResult = await dispatch(registerUser({
          email: params.email,
          firstName: params.name?.split(' ')[0],
          lastName: params.name?.split(' ').slice(1).join(' '),
        }));

        if (registerUser.rejected.match(registerResult)) {
          setError('Failed to create user');
          submittedRef.current = false; // Reset on error to allow retry
          return;
        }

        // Create the transaction
        const transactionResult = await dispatch(createTransaction({
          skuCode: currentSku?.code,
          amount: amount,
          paymentMode: 'ALLOCATION',
          merchantId: params.merchant,
          partnerId: params.partner,
          weightGrams: params.weight,
          multiplier: params.multiplier || currentSku?.multiplier,
          email: params.email,
          firstName: params.name?.split(' ')[0],
          lastName: params.name?.split(' ').slice(1).join(' '),
        }));

        if (createTransaction.fulfilled.match(transactionResult)) {
          setSubmitted(true);
        } else {
          submittedRef.current = false; // Reset on error to allow retry
        }
      } catch (err) {
        setError('Failed to process allocation');
        submittedRef.current = false; // Reset on error to allow retry
      }
    };

    createAllocationTransaction();
  }, [landingCase, params, amount, currentSku, settingsLoading, submitted, dispatch]);

  // Handle amount selection (for PAY and GENERAL cases)
  const handleAmountChange = (newAmount: number) => {
    setSelectedAmount(newAmount);
    setError(null);
  };

  // Handle gift code validation
  const handleGiftCodeValidate = async (code: string) => {
    if (!currentSku) return;

    setError(null);
    const result = await dispatch(validateGiftCode({ code, skuCode: currentSku.code }));
    if (validateGiftCode.fulfilled.match(result)) {
      if (result.payload.valid) {
        setGiftCodeValidated(true);
        if (result.payload.amount) {
          setSelectedAmount(result.payload.amount);
        }
      } else {
        setError(result.payload.message || 'Invalid or already used code');
      }
    } else {
      setError('Failed to validate gift code');
    }
  };

  // Handle form submission
  const handleSubmit = async (formData: LandingFormData) => {
    setError(null);

    // Determine payment mode
    let paymentMode: PaymentMode = 'CLAIM';
    if (landingCase === 'C' || landingCase === 'F') {
      paymentMode = 'PAY';
    } else if (landingCase === 'D') {
      paymentMode = 'GIFT_CARD';
    } else if (landingCase === 'E') {
      paymentMode = 'ALLOCATION';
    }

    try {
      // Register or login user
      const registerResult = await dispatch(registerUser({
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
        street: formData.street,
        city: formData.city,
        postalCode: formData.postalCode,
        country: formData.country,
        state: formData.state,
      }));

      if (registerUser.rejected.match(registerResult)) {
        setError(registerResult.payload as string || 'Registration failed');
        return;
      }

      // For PAY mode (Case C and F), transaction was already created by createPaymentIntent
      // and confirmed by confirmPayment - just show success
      if (paymentMode === 'PAY') {
        submittedRef.current = true;
        setSubmitted(true);
        return;
      }

      // For other modes, create transaction
      const transactionData = {
        skuCode: currentSku?.code,
        amount: amount,
        paymentMode: paymentMode,
        giftCode: formData.giftCode,
        merchantId: params.merchant,
        partnerId: params.partner,
        weightGrams: params.weight || currentSku?.weightGrams || undefined,
        multiplier: params.multiplier || currentSku?.multiplier,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
        street: formData.street,
        city: formData.city,
        postalCode: formData.postalCode,
        country: formData.country,
        state: formData.state,
      };

      const transactionResult = await dispatch(createTransaction(transactionData));

      if (createTransaction.rejected.match(transactionResult)) {
        setError(transactionResult.payload as string || 'Transaction failed');
        return;
      }

      // Success
      submittedRef.current = true;
      setSubmitted(true);
    } catch (err) {
      setError('An unexpected error occurred');
    }
  };

  // Handle view portfolio click
  const handleViewPortfolio = () => {
    goToDashboard();
  };

  // Loading state
  const isLoading = skuLoading || settingsLoading || authLoading || transactionLoading || giftCodeLoading;

  // Render the appropriate form based on case
  const renderForm = () => {
    // Show thank you message if submitted (check both state and ref)
    if (submitted || submittedRef.current) {
      return (
        <ThankYouMessage
          message={message}
          impact={impact}
          onViewPortfolio={handleViewPortfolio}
        />
      );
    }

    // Case E: ALLOCATION - No form, just display
    if (landingCase === 'E') {
      return (
        <AllocationView
          params={params}
          impact={impact}
          message={message}
          onViewPortfolio={handleViewPortfolio}
          isAuthenticated={isAuthenticated}
        />
      );
    }

    // Case A, B: CLAIM
    if (landingCase === 'A' || landingCase === 'B') {
      return (
        <ClaimForm
          formType={formType}
          message={message}
          impact={impact}
          onSubmit={handleSubmit}
          loading={isLoading}
          error={error}
        />
      );
    }

    // Case C: PAY
    if (landingCase === 'C') {
      return (
        <PayForm
          formType={formType}
          message={message}
          impact={impact}
          amount={amount}
          onAmountChange={handleAmountChange}
          onSubmit={handleSubmit}
          loading={isLoading}
          error={error}
        />
      );
    }

    // Case D: GIFT_CARD
    if (landingCase === 'D') {
      return (
        <GiftCardForm
          formType={formType}
          message={message}
          impact={impact}
          giftCodeValidated={giftCodeValidated}
          validatedGiftCode={validationResult}
          onValidateCode={handleGiftCodeValidate}
          onSubmit={handleSubmit}
          loading={isLoading}
          error={error}
        />
      );
    }

    // Case F: GENERAL
    return (
      <GeneralForm
        formType={formType}
        message={message}
        impact={impact}
        amount={amount}
        onAmountChange={handleAmountChange}
        onSubmit={handleSubmit}
        loading={isLoading}
        error={error}
      />
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-white pt-14">
      {/* Navigation */}
      <Navigation />

      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-1 px-4 md:px-8 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Dynamic Message */}
          {!submitted && (
            <div className="text-center mb-8 animate-fade-right-normal">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-2">
                {message.title}
              </h2>
              <p className="text-gray-600">{message.message}</p>
            </div>
          )}

          {/* Protocol Block */}
          <ProtocolBlock className="mb-8" />

          {/* Form or Loading */}
          {isLoading && !submitted ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="large" />
            </div>
          ) : (
            <div className="animate-fade-up-light-slow">
              {renderForm()}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default LandingPage;
