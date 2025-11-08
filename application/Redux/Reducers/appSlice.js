import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';


const initialState = {
  language: { label: 'English', value: 'en' },
  token: null,
  isInternetConnected: null,
};


export const checkInternetConnection = createAsyncThunk(
  'app/checkInternetConnection',
  async (_, thunkAPI) => {
    try {
      const response = await axios.get('https://codarambha-git-force-transit-pay-ba.vercel.app/health', {
        timeout: 5000,
      });
      if (response.status === 200) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  },
);



const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setLanguage(state, action) {
      state.language = action.payload;
    },
    setToken(state, action) {
      state.token = action.payload;
    },
    clearToken(state) {
      state.token = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkInternetConnection.fulfilled, (state, action) => {
        state.isInternetConnected = action.payload;
      });
  }
});

export const { setLanguage, setToken, clearToken } = appSlice.actions;
export default appSlice.reducer;


