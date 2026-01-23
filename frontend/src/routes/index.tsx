// CSR26 Routes Configuration
// Defines all application routes
// DATA FLOW: Router → Page Component → Redux → API → Backend

import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { useNavigation } from '../hooks/useNavigation';
import Button from '@mui/material/Button';

// Implemented pages
import LandingPage from '../pages/Landing';
import DashboardPage from '../pages/Dashboard';
import MerchantDashboardPage from '../pages/MerchantDashboard';
import AdminPage from '../pages/Admin';
import LoginPage from '../pages/Login';
import VerifyPage from '../pages/Verify';
import TermsPage from '../pages/Terms';
import PrivacyPage from '../pages/Privacy';

// Not Found component
const NotFound = () => {
  const { goToLanding } = useNavigation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Page Not Found</h2>
        <p className="text-gray-600 mb-6">The page you're looking for doesn't exist.</p>
        <Button
          variant="contained"
          onClick={() => goToLanding()}
          sx={{ textTransform: 'none' }}
        >
          Go Home
        </Button>
      </div>
    </div>
  );
};

// Protected route wrapper
interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireMerchant?: boolean;
}

const ProtectedRoute = ({
  children,
  requireAuth = false,
  requireAdmin = false,
  requireMerchant = false,
}: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  // Check authentication
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check admin role
  if (requireAdmin && user?.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  // Check merchant role
  if (requireMerchant && user?.role !== 'MERCHANT' && user?.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Main routes configuration
const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Navigate to="/landing" replace />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/verify/:token" element={<VerifyPage />} />
      <Route path="/auth/verify/:token" element={<VerifyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />

      {/* Protected user routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute requireAuth>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Protected merchant routes */}
      <Route
        path="/merchant"
        element={
          <ProtectedRoute requireAuth requireMerchant>
            <MerchantDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/merchant/:id"
        element={
          <ProtectedRoute requireAuth requireMerchant>
            <MerchantDashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Protected admin routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requireAuth requireAdmin>
            <AdminPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute requireAuth requireAdmin>
            <AdminPage />
          </ProtectedRoute>
        }
      />

      {/* 404 - Not Found */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
