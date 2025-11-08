// walletSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { create } from 'react-test-renderer';

// Helper: Decode base64url JWT payload safely
const decodeJwtPayload = payload => {
  try {
    let base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    const decodedStr = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(decodedStr);
  } catch (err) {
    return null;
  }
};

// Async thunk to load token and decode userId
export const loadToken = createAsyncThunk(
  'wallet/loadToken',
  async (_, thunkAPI) => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      if (!storedToken) return thunkAPI.rejectWithValue('No token found');

      const parts = storedToken.split('.');
      if (parts.length !== 3) return thunkAPI.rejectWithValue('Invalid token');

      const decoded = decodeJwtPayload(parts[1]);
      if (!decoded?.id)
        return thunkAPI.rejectWithValue('Invalid token payload');

      return { token: storedToken, userId: decoded.id };
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  },
);

// Async thunk to fetch wallet data
export const fetchWallet = createAsyncThunk(
  'wallet/fetchWallet',
  async (userId, thunkAPI) => {
    try {
      const response = await axios.get(
        `https://codarambha-git-force-transit-pay-ba.vercel.app/api/wallets/${userId}`,
      );
      // response.data.wallet contains the actual wallet
      return response.data.wallet;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || err.message,
      );
    }
  },
);

export const getCards = createAsyncThunk(
  'wallet/getCards',
  async (userId, thunkAPI) => {
    try {
      const response = await axios.get(
        `https://codarambha-git-force-transit-pay-ba.vercel.app/api/card-requests/${userId}`,
      );
      return response.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || err.message,
      );
    }
  },
);

const walletSlice = createSlice({
  name: 'wallet',
  initialState: {
    wallet: null,
    token: null,
    userId: null,
    loading: false,
    error: null,
    cards: [
      {
        card: null,
        name: '...',
        lastName: '...',
      },
    ],
  },
  reducers: {},
  extraReducers: builder => {
    builder
      // Load token
      .addCase(loadToken.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadToken.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.userId = action.payload.userId;
      })
      .addCase(loadToken.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch wallet
      .addCase(fetchWallet.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWallet.fulfilled, (state, action) => {
        state.loading = false;
        state.wallet = action.payload;
      })
      .addCase(fetchWallet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getCards.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCards.fulfilled, (state, action) => {
        state.loading = false;
        state.cards = action.payload;
      })
      .addCase(getCards.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default walletSlice.reducer;
