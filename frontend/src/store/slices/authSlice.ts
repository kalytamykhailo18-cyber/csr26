// CSR26 Auth Slice
// Manages authentication state: user, token, login/logout
// DATA FLOW: Component → dispatch action → Redux slice calls API → Backend → Response → Redux store → useSelector → UI

import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { authApi, setAuthToken, clearAuthToken, getAuthToken } from '../../api/apiClient';
import type { User, RegisterRequest } from '../../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  magicLinkSent: boolean;
}

const initialState: AuthState = {
  user: null,
  token: getAuthToken(),
  isAuthenticated: false,
  loading: false,
  error: null,
  magicLinkSent: false,
};

// Async thunk: Register new user (from landing page)
export const registerUser = createAsyncThunk(
  'auth/register',
  async (data: RegisterRequest, { rejectWithValue }) => {
    try {
      const response = await authApi.register(data);
      const { user, token } = response.data.data;
      setAuthToken(token);
      return { user, token };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Async thunk: Send magic link for login
export const sendMagicLink = createAsyncThunk(
  'auth/sendMagicLink',
  async (email: string, { rejectWithValue }) => {
    try {
      const response = await authApi.sendMagicLink(email);
      return response.data.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Async thunk: Verify magic link token
export const verifyMagicLink = createAsyncThunk(
  'auth/verifyMagicLink',
  async (token: string, { rejectWithValue }) => {
    try {
      const response = await authApi.verifyToken(token);
      const { user, token: authToken } = response.data.data;
      setAuthToken(authToken);
      return { user, token: authToken };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Async thunk: Get current user (on app load if token exists)
export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authApi.getMe();
      return response.data.data;
    } catch (error) {
      clearAuthToken();
      return rejectWithValue((error as Error).message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Logout - clear all auth state
    logout: (state) => {
      clearAuthToken();
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      state.magicLinkSent = false;
    },
    // Clear error
    clearAuthError: (state) => {
      state.error = null;
    },
    // Reset magic link sent status
    resetMagicLinkStatus: (state) => {
      state.magicLinkSent = false;
    },
    // Set user directly (for immediate updates after registration)
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
  },
  extraReducers: (builder) => {
    // Register user
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Send magic link
    builder
      .addCase(sendMagicLink.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.magicLinkSent = false;
      })
      .addCase(sendMagicLink.fulfilled, (state) => {
        state.loading = false;
        state.magicLinkSent = true;
      })
      .addCase(sendMagicLink.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Verify magic link
    builder
      .addCase(verifyMagicLink.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyMagicLink.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(verifyMagicLink.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Get current user
    builder
      .addCase(getCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  logout,
  clearAuthError,
  resetMagicLinkStatus,
  setUser,
} = authSlice.actions;

export default authSlice.reducer;
