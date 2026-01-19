// CSR26 Wallet Slice
// Manages user wallet: balance, impact, status, threshold progress
// DATA FLOW: Component → dispatch action → Redux slice calls API → Backend → DB → Response → Redux store → useSelector → UI

import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { walletApi } from '../../api/apiClient';
import type { WalletSummary, UserStatus } from '../../types';

interface WalletState {
  wallet: WalletSummary | null;
  loading: boolean;
  error: string | null;
}

const initialState: WalletState = {
  wallet: null,
  loading: false,
  error: null,
};

// Async thunk: Fetch current user's wallet
export const fetchWallet = createAsyncThunk(
  'wallet/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const response = await walletApi.get();
      return response.data.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Async thunk: Fetch wallet by email (for landing page before login)
export const fetchWalletByEmail = createAsyncThunk(
  'wallet/fetchByEmail',
  async (email: string, { rejectWithValue }) => {
    try {
      const response = await walletApi.getByEmail(email);
      return response.data.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    // Clear wallet
    clearWallet: (state) => {
      state.wallet = null;
    },
    // Clear error
    clearWalletError: (state) => {
      state.error = null;
    },
    // Update wallet locally (after transaction)
    updateWalletLocal: (state, action: PayloadAction<{ addedAmount: number; addedImpactKg: number; threshold: number }>) => {
      if (state.wallet) {
        const { addedAmount, addedImpactKg, threshold } = action.payload;
        state.wallet.balance += addedAmount;
        state.wallet.impactKg += addedImpactKg;
        state.wallet.transactionCount += 1;
        state.wallet.thresholdProgress = Math.min((state.wallet.balance / threshold) * 100, 100);
        // Check if crossed threshold
        if (state.wallet.balance >= threshold && state.wallet.status === 'ACCUMULATION') {
          state.wallet.status = 'CERTIFIED' as UserStatus;
        }
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch wallet
    builder
      .addCase(fetchWallet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWallet.fulfilled, (state, action: PayloadAction<WalletSummary>) => {
        state.loading = false;
        state.wallet = action.payload;
      })
      .addCase(fetchWallet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch wallet by email
    builder
      .addCase(fetchWalletByEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWalletByEmail.fulfilled, (state, action: PayloadAction<WalletSummary>) => {
        state.loading = false;
        state.wallet = action.payload;
      })
      .addCase(fetchWalletByEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearWallet,
  clearWalletError,
  updateWalletLocal,
} = walletSlice.actions;

export default walletSlice.reducer;
