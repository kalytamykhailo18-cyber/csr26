// CSR26 Merchant Slice
// Manages merchant data: summary, transactions, billing
// DATA FLOW: Component → dispatch action → Redux slice calls API → Backend → DB → Response → Redux store → useSelector → UI

import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { merchantApi } from '../../api/apiClient';
import type {
  Merchant,
  MerchantSummary,
  MerchantBillingInfo,
  MerchantWithCounts,
  TransactionWithRelations,
  TransactionListResponse
} from '../../types';

interface MerchantState {
  // Current merchant (for merchant dashboard)
  currentMerchant: MerchantSummary | null;
  // All merchants (for admin)
  merchants: MerchantWithCounts[];
  // Merchant transactions
  transactions: TransactionWithRelations[];
  transactionsTotal: number;
  // Billing info
  billing: MerchantBillingInfo | null;
  // Loading states
  loading: boolean;
  error: string | null;
}

const initialState: MerchantState = {
  currentMerchant: null,
  merchants: [],
  transactions: [],
  transactionsTotal: 0,
  billing: null,
  loading: false,
  error: null,
};

// Async thunk: Fetch all merchants (admin)
export const fetchAllMerchants = createAsyncThunk(
  'merchant/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await merchantApi.getAll();
      return response.data.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Async thunk: Fetch merchant by ID
export const fetchMerchantById = createAsyncThunk(
  'merchant/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await merchantApi.getById(id);
      return response.data.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Async thunk: Fetch merchant transactions
export const fetchMerchantTransactions = createAsyncThunk(
  'merchant/fetchTransactions',
  async ({ id, limit, offset, dateFrom, dateTo }: {
    id: string;
    limit?: number;
    offset?: number;
    dateFrom?: string;
    dateTo?: string;
  }, { rejectWithValue }) => {
    try {
      const response = await merchantApi.getTransactions(id, { limit, offset, dateFrom, dateTo });
      return response.data.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Async thunk: Fetch merchant billing info
export const fetchMerchantBilling = createAsyncThunk(
  'merchant/fetchBilling',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await merchantApi.getBilling(id);
      return response.data.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Async thunk: Create new merchant (admin)
export const createMerchant = createAsyncThunk(
  'merchant/create',
  async (data: Partial<Merchant>, { rejectWithValue }) => {
    try {
      const response = await merchantApi.create(data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Async thunk: Update merchant (admin)
export const updateMerchant = createAsyncThunk(
  'merchant/update',
  async ({ id, data }: { id: string; data: Partial<Merchant> }, { rejectWithValue }) => {
    try {
      const response = await merchantApi.update(id, data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

const merchantSlice = createSlice({
  name: 'merchant',
  initialState,
  reducers: {
    // Clear current merchant
    clearCurrentMerchant: (state) => {
      state.currentMerchant = null;
      state.transactions = [];
      state.transactionsTotal = 0;
      state.billing = null;
    },
    // Clear error
    clearMerchantError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch all merchants
    builder
      .addCase(fetchAllMerchants.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllMerchants.fulfilled, (state, action: PayloadAction<MerchantWithCounts[]>) => {
        state.loading = false;
        state.merchants = action.payload;
      })
      .addCase(fetchAllMerchants.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch merchant by ID
    builder
      .addCase(fetchMerchantById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMerchantById.fulfilled, (state, action: PayloadAction<MerchantSummary>) => {
        state.loading = false;
        state.currentMerchant = action.payload;
      })
      .addCase(fetchMerchantById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch merchant transactions
    builder
      .addCase(fetchMerchantTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMerchantTransactions.fulfilled, (state, action: PayloadAction<TransactionListResponse>) => {
        state.loading = false;
        state.transactions = action.payload.transactions;
        state.transactionsTotal = action.payload.total;
      })
      .addCase(fetchMerchantTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch merchant billing
    builder
      .addCase(fetchMerchantBilling.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMerchantBilling.fulfilled, (state, action: PayloadAction<MerchantBillingInfo>) => {
        state.loading = false;
        state.billing = action.payload;
      })
      .addCase(fetchMerchantBilling.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create merchant
    builder
      .addCase(createMerchant.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createMerchant.fulfilled, (state, action: PayloadAction<Merchant>) => {
        state.loading = false;
        state.merchants.unshift(action.payload as MerchantWithCounts);
      })
      .addCase(createMerchant.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update merchant
    builder
      .addCase(updateMerchant.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateMerchant.fulfilled, (state, action: PayloadAction<Merchant>) => {
        state.loading = false;
        const index = state.merchants.findIndex(m => m.id === action.payload.id);
        if (index !== -1) {
          state.merchants[index] = { ...state.merchants[index], ...action.payload };
        }
      })
      .addCase(updateMerchant.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearCurrentMerchant,
  clearMerchantError,
} = merchantSlice.actions;

export default merchantSlice.reducer;
