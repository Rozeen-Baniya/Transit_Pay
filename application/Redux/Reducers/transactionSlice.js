import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
    transactions: [],
    loading: false,
    error: null,
}

// API fetchings

export const fetchTransactions = createAsyncThunk(
  'transactions/fetchTransactions',
  async (userId, thunkAPI) => {
    try {
      const response = await axios.get(
        `https://codarambha-git-force-transit-pay-ba.vercel.app/api/transactions/${userId}`,
      );
      return response.data.transactions;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || err.message,
      );
    }
  },
);


const transactionSlice = createSlice({

    name: 'transactions',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder

            .addCase(fetchTransactions.pending, (state) => {
                state.loading = true;
                state.error = null;
            }
            )
            .addCase(fetchTransactions.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            }
            )
            .addCase(fetchTransactions.fulfilled, (state, action) => {
                state.loading = false;
                state.error = null;
                state.transactions = action.payload;
            }
            )
    }
})      

export default transactionSlice.reducer;