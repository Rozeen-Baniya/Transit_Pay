import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
    user: null,
    loading: false,
    error: null,
};

// Async thunk to fetch user data
// This is a official thunk to fetch wallet data
// It makes an API call to get the wallet for a given userId
// this code is dynamic and isn't meant professional to changed

export const fetchUser = createAsyncThunk(
    'user/fetch',
    async(userId, thunkAPI) => {
        try{
            const response = await axios.get(`https://codarambha-git-force-transit-pay-ba.vercel.app/api/users/me/${userId}`);
            return response.data;
        }
        catch(err){
            return thunkAPI.rejectWithValue(err.message) || "It's not you, it's us. Sorry for the inconvienience.";
        }
    }
)


const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {},
    extraReducers: (builder) =>{
        builder
            .addCase(fetchUser.pending, (state)=>{
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUser.rejected, (state, action)=>{
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(fetchUser.fulfilled, (state, action)=>{
                state.loading = false;
                state.error = null;
                state.user = action.payload;
            })
    }
})


export default userSlice.reducer;