// CSR26 Transaction Slice
// Manages transactions: create, list, filters
// DATA FLOW: Component → dispatch action → Redux slice calls API → Backend → DB → Response → Redux store → useSelector → UI

import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { transactionApi } from '../../api/apiClient';
import type { Transaction, TransactionWithRelations, CreateTransactionRequest, TransactionListResponse, PaymentMode } from '../../types';

interface TransactionState {
  // User's transactions
  transactions: TransactionWithRelations[];
  // Single transaction detail
  currentTransaction: TransactionWithRelations | null;
  // Total count for pagination
  total: number;
  // Loading state
  loading: boolean;
  error: string | null;
  // Last created transaction (for showing confirmation)
  lastCreated: Transaction | null;
}

const initialState: TransactionState = {
  transactions: [],
  currentTransaction: null,
  total: 0,
  loading: false,
  error: null,
  lastCreated: null,
};

// Async thunk: Create new transaction (from landing page)
export const createTransaction = createAsyncThunk(
  'transaction/create',
  async (data: CreateTransactionRequest, { rejectWithValue }) => {
    try {
      const response = await transactionApi.create(data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Async thunk: Fetch user's transactions
export const fetchTransactions = createAsyncThunk(
  'transaction/fetchAll',
  async (params: { limit?: number; offset?: number; paymentMode?: PaymentMode; merchantId?: string } | undefined, { rejectWithValue }) => {
    try {
      const response = await transactionApi.getAll(params);
      return response.data.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Async thunk: Fetch single transaction by ID
export const fetchTransactionById = createAsyncThunk(
  'transaction/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await transactionApi.getById(id);
      return response.data.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

const transactionSlice = createSlice({
  name: 'transaction',
  initialState,
  reducers: {
    // Clear transactions
    clearTransactions: (state) => {
      state.transactions = [];
      state.total = 0;
    },
    // Clear current transaction
    clearCurrentTransaction: (state) => {
      state.currentTransaction = null;
    },
    // Clear last created
    clearLastCreated: (state) => {
      state.lastCreated = null;
    },
    // Clear error
    clearTransactionError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Create transaction
    builder
      .addCase(createTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.lastCreated = null;
      })
      .addCase(createTransaction.fulfilled, (state, action: PayloadAction<Transaction>) => {
        state.loading = false;
        state.lastCreated = action.payload;
        // Add to beginning of transactions list
        state.transactions.unshift(action.payload as TransactionWithRelations);
        state.total += 1;
      })
      .addCase(createTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch transactions
    builder
      .addCase(fetchTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action: PayloadAction<TransactionListResponse>) => {
        state.loading = false;
        state.transactions = action.payload.transactions;
        state.total = action.payload.total;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch single transaction
    builder
      .addCase(fetchTransactionById.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.currentTransaction = null;
      })
      .addCase(fetchTransactionById.fulfilled, (state, action: PayloadAction<TransactionWithRelations>) => {
        state.loading = false;
        state.currentTransaction = action.payload;
      })
      .addCase(fetchTransactionById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearTransactions,
  clearCurrentTransaction,
  clearLastCreated,
  clearTransactionError,
} = transactionSlice.actions;

export default transactionSlice.reducer;
