// CSR26 Global Navigation Component
// Auth-aware navigation bar shown across all pages
// DATA FLOW: useAppSelector reads auth state → UI renders appropriate links

import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logout } from '../store/slices/authSlice';
import { useNavigation } from '../hooks/useNavigation';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';

const Navigation = () => {
  const dispatch = useAppDispatch();
  const { goToLanding, goToDashboard, goToLogin, goToAdmin, goToMerchantDashboard, isOnRoute, isOnRoutePath } = useNavigation();

  // Redux state
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  // Local state for menus
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isMenuOpen = Boolean(anchorEl);

  // Handlers
  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    setMobileMenuOpen(false);
    dispatch(logout());
    goToLanding();
  };

  const handleDashboard = () => {
    handleMenuClose();
    setMobileMenuOpen(false);
    goToDashboard();
  };

  const handleAdmin = () => {
    handleMenuClose();
    setMobileMenuOpen(false);
    goToAdmin();
  };

  const handleMerchant = () => {
    handleMenuClose();
    setMobileMenuOpen(false);
    goToMerchantDashboard();
  };

  const handleLogin = () => {
    setMobileMenuOpen(false);
    goToLogin();
  };

  const handleHome = () => {
    setMobileMenuOpen(false);
    goToLanding();
  };

  // Check if user is admin or merchant
  const isAdmin = user?.role === 'ADMIN';
  const isMerchant = user?.role === 'MERCHANT' || isAdmin;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 w-full py-3 px-4 md:px-8 bg-green-600/80 backdrop-blur-md border-b border-green-700/90">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={handleHome}
          className="text-xl font-bold text-white hover:text-green-100 transition-colors"
        >
          CSR26
        </button>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated ? (
            <>
              {/* Dashboard Link */}
              <Button
                onClick={handleDashboard}
                startIcon={<DashboardIcon />}
                sx={{
                  textTransform: 'none',
                  color: isOnRoute('/dashboard') ? '#ffffff' : 'rgba(255,255,255,0.85)',
                  fontWeight: isOnRoute('/dashboard') ? 600 : 400,
                  '&:hover': { color: '#ffffff', backgroundColor: 'rgba(255,255,255,0.1)' },
                }}
              >
                Dashboard
              </Button>

              {/* Merchant Link (if merchant or admin) */}
              {isMerchant && (
                <Button
                  onClick={handleMerchant}
                  sx={{
                    textTransform: 'none',
                    color: isOnRoutePath('/merchant') ? '#ffffff' : 'rgba(255,255,255,0.85)',
                    fontWeight: isOnRoutePath('/merchant') ? 600 : 400,
                    '&:hover': { color: '#ffffff', backgroundColor: 'rgba(255,255,255,0.1)' },
                  }}
                >
                  Merchant
                </Button>
              )}

              {/* Admin Link (if admin) */}
              {isAdmin && (
                <Button
                  onClick={handleAdmin}
                  sx={{
                    textTransform: 'none',
                    color: isOnRoutePath('/admin') ? '#ffffff' : 'rgba(255,255,255,0.85)',
                    fontWeight: isOnRoutePath('/admin') ? 600 : 400,
                    '&:hover': { color: '#ffffff', backgroundColor: 'rgba(255,255,255,0.1)' },
                  }}
                >
                  Admin
                </Button>
              )}

              {/* User Menu */}
              <IconButton
                onClick={handleUserMenuOpen}
                size="small"
                sx={{ ml: 1 }}
                aria-controls={isMenuOpen ? 'user-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={isMenuOpen ? 'true' : undefined}
              >
                <AccountCircleIcon sx={{ fontSize: 32, color: '#ffffff' }} />
              </IconButton>

              <Menu
                id="user-menu"
                anchorEl={anchorEl}
                open={isMenuOpen}
                onClose={handleMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                {/* User Info */}
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-800">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>

                <MenuItem onClick={handleDashboard}>
                  <DashboardIcon fontSize="small" sx={{ mr: 1.5, color: '#6b7280' }} />
                  Dashboard
                </MenuItem>

                <Divider />

                <MenuItem onClick={handleLogout}>
                  <LogoutIcon fontSize="small" sx={{ mr: 1.5, color: '#6b7280' }} />
                  Logout
                </MenuItem>
              </Menu>
            </>
          ) : (
            <>
              {/* Login Button */}
              <Button
                onClick={handleLogin}
                sx={{
                  textTransform: 'none',
                  color: 'rgba(255,255,255,0.85)',
                  '&:hover': { color: '#ffffff', backgroundColor: 'rgba(255,255,255,0.1)' },
                }}
              >
                Login
              </Button>

              {/* Get Started Button */}
              <Button
                onClick={handleHome}
                variant="contained"
                sx={{
                  textTransform: 'none',
                  backgroundColor: '#ffffff',
                  color: '#166534',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.9)' },
                }}
              >
                Get Started
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden">
          <IconButton
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            size="small"
          >
            {mobileMenuOpen ? (
              <CloseIcon sx={{ fontSize: 28, color: '#ffffff' }} />
            ) : (
              <MenuIcon sx={{ fontSize: 28, color: '#ffffff' }} />
            )}
          </IconButton>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-4 pb-4 border-t border-white/20 pt-4 animate-fade-down-fast">
          {isAuthenticated ? (
            <div className="space-y-2">
              {/* User Info */}
              <div className="px-2 py-2 mb-2">
                <p className="text-sm font-medium text-white">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-white/70">{user?.email}</p>
              </div>

              <button
                onClick={handleDashboard}
                className="w-full text-left px-2 py-2 text-white hover:bg-white/10 rounded-md flex items-center"
              >
                <DashboardIcon fontSize="small" sx={{ mr: 1.5, color: '#ffffff' }} />
                Dashboard
              </button>

              {isMerchant && (
                <button
                  onClick={handleMerchant}
                  className="w-full text-left px-2 py-2 text-white hover:bg-white/10 rounded-md"
                >
                  Merchant Dashboard
                </button>
              )}

              {isAdmin && (
                <button
                  onClick={handleAdmin}
                  className="w-full text-left px-2 py-2 text-white hover:bg-white/10 rounded-md"
                >
                  Admin Panel
                </button>
              )}

              <div className="border-t border-white/20 mt-2 pt-2">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-2 py-2 text-red-200 hover:bg-white/10 rounded-md flex items-center"
                >
                  <LogoutIcon fontSize="small" sx={{ mr: 1.5, color: '#fecaca' }} />
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={handleLogin}
                className="w-full text-left px-2 py-2 text-white hover:bg-white/10 rounded-md"
              >
                Login
              </button>
              <button
                onClick={handleHome}
                className="w-full text-center px-4 py-2 bg-white text-green-700 rounded-md hover:bg-white/90"
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navigation;
