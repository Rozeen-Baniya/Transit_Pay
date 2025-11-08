import { configureStore } from '@reduxjs/toolkit';
import appReducer from './Reducers/appSlice';
import walletReducer from './Reducers/WalletSlice';
import userReducer from './Reducers/userSlice';
import transactionReducer from './Reducers/transactionSlice';
import tripReducer from './Reducers/tripSlice';

export const store = configureStore({
  reducer: {
    app: appReducer,
    wallet: walletReducer,
    user: userReducer,
    transaction: transactionReducer,
    trip: tripReducer
  },
});

export default store;


