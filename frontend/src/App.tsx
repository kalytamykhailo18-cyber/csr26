// CSR26 Main App Component
// Wraps the application with all necessary providers
// DATA FLOW: Provider → Redux Store → Components → useSelector → UI

import { useEffect, useRef } from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import store from './store';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { getCurrentUser } from './store/slices/authSlice';
import { fetchSettings } from './store/slices/settingsSlice';
import theme from './theme';
import AppRoutes from './routes';
import LoadingSpinner from './components/LoadingSpinner';

// App initializer - fetches initial data on mount
const AppInitializer = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useAppDispatch();
  const { token, loading: authLoading, isAuthenticated } = useAppSelector((state) => state.auth);
  const { settings } = useAppSelector((state) => state.settings);
  const initialLoadRef = useRef(true);

  useEffect(() => {
    // Fetch settings on app load (public endpoint)
    if (!settings) {
      dispatch(fetchSettings());
    }
  }, [dispatch, settings]);

  useEffect(() => {
    // Only verify token on INITIAL load, not after registration
    if (token && initialLoadRef.current && !isAuthenticated) {
      dispatch(getCurrentUser());
    }
    initialLoadRef.current = false;
  }, [dispatch, token, isAuthenticated]);

  // Only show loading on initial app load, not during registration
  if (authLoading && token && initialLoadRef.current) {
    return <LoadingSpinner fullPage message="Loading..." />;
  }

  return <>{children}</>;
};

// Main App component with all providers
const App = () => {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <AppInitializer>
            <AppRoutes />
          </AppInitializer>
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );
};

export default App;
