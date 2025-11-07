import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  language: { label: 'English', value: 'en' },
  token: null,
};

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
});

export const { setLanguage, setToken, clearToken } = appSlice.actions;
export default appSlice.reducer;


