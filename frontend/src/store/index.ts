// CSR26 Redux Store
// Central store configuration
// RULE: All data through Redux, NO direct API calls from components

import { configureStore } from '@reduxjs/toolkit';

// Import all slices
import uiReducer from './slices/uiSlice';
import authReducer from './slices/authSlice';
import settingsReducer from './slices/settingsSlice';
import skuReducer from './slices/skuSlice';
import transactionReducer from './slices/transactionSlice';
import walletReducer from './slices/walletSlice';
import merchantReducer from './slices/merchantSlice';
import giftCodeReducer from './slices/giftCodeSlice';
import userReducer from './slices/userSlice';

// Configure the store
export const store = configureStore({
  reducer: {
    ui: uiReducer,
    auth: authReducer,
    settings: settingsReducer,
    sku: skuReducer,
    transaction: transactionReducer,
    wallet: walletReducer,
    merchant: merchantReducer,
    giftCode: giftCodeReducer,
    user: userReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serializable check
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: import.meta.env.DEV, // Enable Redux DevTools only in development
});

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
