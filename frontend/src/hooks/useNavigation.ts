// CSR26 Navigation Hook
// RULE: Use this hook for ALL navigation, NO Link/a tags
// This ensures consistent navigation behavior throughout the app

import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useCallback } from 'react';
import type { LandingParams } from '../types';

export const useNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Navigate to a path
  const goTo = useCallback((path: string, options?: { replace?: boolean }) => {
    navigate(path, options);
  }, [navigate]);

  // Navigate to landing page with optional params
  const goToLanding = useCallback((params?: LandingParams) => {
    if (params) {
      const searchParams = new URLSearchParams();
      if (params.sku) searchParams.set('sku', params.sku);
      if (params.amount) searchParams.set('amount', params.amount.toString());
      if (params.merchant) searchParams.set('merchant', params.merchant);
      if (params.partner) searchParams.set('partner', params.partner);
      if (params.name) searchParams.set('name', params.name);
      if (params.email) searchParams.set('email', params.email);
      if (params.weight) searchParams.set('weight', params.weight.toString());
      if (params.multiplier) searchParams.set('multiplier', params.multiplier.toString());
      navigate(`/landing?${searchParams.toString()}`);
    } else {
      navigate('/landing');
    }
  }, [navigate]);

  // Navigate to user dashboard
  const goToDashboard = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  // Navigate to merchant dashboard
  const goToMerchantDashboard = useCallback((merchantId?: string) => {
    if (merchantId) {
      navigate(`/merchant/${merchantId}`);
    } else {
      navigate('/merchant');
    }
  }, [navigate]);

  // Navigate to admin panel
  const goToAdmin = useCallback(() => {
    navigate('/admin');
  }, [navigate]);

  // Navigate to login
  const goToLogin = useCallback(() => {
    navigate('/login');
  }, [navigate]);

  // Navigate to magic link verification
  const goToVerify = useCallback((token: string) => {
    navigate(`/verify/${token}`);
  }, [navigate]);

  // Go back
  const goBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  // Replace current route (no history entry)
  const replace = useCallback((path: string) => {
    navigate(path, { replace: true });
  }, [navigate]);

  // Get current path
  const getCurrentPath = useCallback(() => {
    return location.pathname;
  }, [location.pathname]);

  // Get URL search params as LandingParams
  const getLandingParams = useCallback((): LandingParams => {
    return {
      sku: searchParams.get('sku') || undefined,
      amount: searchParams.get('amount') ? parseFloat(searchParams.get('amount')!) : undefined,
      merchant: searchParams.get('merchant') || undefined,
      partner: searchParams.get('partner') || undefined,
      name: searchParams.get('name') || undefined,
      email: searchParams.get('email') || undefined,
      weight: searchParams.get('weight') ? parseInt(searchParams.get('weight')!) : undefined,
      multiplier: searchParams.get('multiplier') ? parseInt(searchParams.get('multiplier')!) : undefined,
    };
  }, [searchParams]);

  // Check if on specific route
  const isOnRoute = useCallback((path: string) => {
    return location.pathname === path;
  }, [location.pathname]);

  // Check if route starts with path
  const isOnRoutePath = useCallback((path: string) => {
    return location.pathname.startsWith(path);
  }, [location.pathname]);

  return {
    goTo,
    goToLanding,
    goToDashboard,
    goToMerchantDashboard,
    goToAdmin,
    goToLogin,
    goToVerify,
    goBack,
    replace,
    getCurrentPath,
    getLandingParams,
    isOnRoute,
    isOnRoutePath,
    // Expose raw location for edge cases
    location,
    searchParams,
  };
};

export default useNavigation;
