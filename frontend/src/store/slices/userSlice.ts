// CSR26 User Slice (Admin)
// Manages user data for admin panel
// DATA FLOW: Component → dispatch action → Redux slice calls API → Backend → DB → Response → Redux store → useSelector → UI

import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { userApi } from '../../api/apiClient';
import type { User, UserWithCounts, UserWithTransactions, UserListResponse } from '../../types';

interface UserState {
  // All users (paginated)
  users: UserWithCounts[];
  total: number;
  // Selected user details
  selectedUser: UserWithTransactions | null;
  // Loading states
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  users: [],
  total: 0,
  selectedUser: null,
  loading: false,
  error: null,
};

// Async thunk: Fetch all users
export const fetchAllUsers = createAsyncThunk(
  'user/fetchAll',
  async (params: { search?: string; status?: string; limit?: number; offset?: number; sortBy?: string; sortOrder?: string } | undefined, { rejectWithValue }) => {
    try {
      const response = await userApi.getAll(params);
      return response.data.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Async thunk: Fetch user by ID
export const fetchUserById = createAsyncThunk(
  'user/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await userApi.getById(id);
      return response.data.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Async thunk: Update user
export const updateUserAdmin = createAsyncThunk(
  'user/update',
  async ({ id, data }: { id: string; data: Partial<User> }, { rejectWithValue }) => {
    try {
      const response = await userApi.update(id, data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Async thunk: Adjust user wallet
export const adjustUserWallet = createAsyncThunk(
  'user/adjustWallet',
  async ({ id, amount, reason }: { id: string; amount: number; reason: string }, { rejectWithValue }) => {
    try {
      const response = await userApi.adjustWallet(id, { amount, reason });
      return response.data.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // Clear selected user
    clearSelectedUser: (state) => {
      state.selectedUser = null;
    },
    // Clear error
    clearUserError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch all users
    builder
      .addCase(fetchAllUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action: PayloadAction<UserListResponse>) => {
        state.loading = false;
        state.users = action.payload.users;
        state.total = action.payload.total;
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch user by ID
    builder
      .addCase(fetchUserById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserById.fulfilled, (state, action: PayloadAction<UserWithTransactions>) => {
        state.loading = false;
        state.selectedUser = action.payload;
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update user
    builder
      .addCase(updateUserAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserAdmin.fulfilled, (state, action: PayloadAction<User>) => {
        state.loading = false;
        // Update in list
        const index = state.users.findIndex(u => u.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = { ...state.users[index], ...action.payload };
        }
        // Update selected user
        if (state.selectedUser?.id === action.payload.id) {
          state.selectedUser = { ...state.selectedUser, ...action.payload };
        }
      })
      .addCase(updateUserAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Adjust user wallet
    builder
      .addCase(adjustUserWallet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(adjustUserWallet.fulfilled, (state, action: PayloadAction<UserWithCounts>) => {
        state.loading = false;
        // Update in list
        const index = state.users.findIndex(u => u.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
      })
      .addCase(adjustUserWallet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearSelectedUser, clearUserError } = userSlice.actions;

export default userSlice.reducer;
