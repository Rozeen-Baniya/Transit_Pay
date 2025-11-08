import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";


const initialState = {
    loading: false,
    error: null,
    trips: []
}


export const fetchAllTrips = createAsyncThunk(
    'fetch/trips',
    async(userId, ThunkAPI) =>{
        try {
            const response = await axios.get(`https://codarambha-git-force-transit-pay-ba.vercel.app/api/trips/${userId}`)
            return response.data;
        } catch (error) {
            return ThunkAPI.rejectWithValue(error.message || "Fetching trips failed.")
        }
    }
)


const tripSlice = createSlice({
    name: 'trip',
    initialState,
    reducers: {},
    extraReducers: (builder)=>{
        builder
        .addCase(fetchAllTrips.pending, (state)=>{
            state.error = null;
            state.loading = true;
        })
        .addCase(fetchAllTrips.rejected, (state, action)=>{
            state.loading = false;
            state.error = action.payload;
        })
        .addCase(fetchAllTrips.fulfilled, (state, action)=>{
            state.loading = false;
            state.error = null;
            state.trips = action.payload;
        })
    }
})


export default tripSlice.reducer;