import { PayloadAction, createSlice } from '@reduxjs/toolkit';

interface otpState {
    otpSent: boolean;
}

const initialState: otpState = {
    otpSent: false,
};

export const otpSlice = createSlice({
    name: 'otp',
    initialState,
    reducers: {
        setOtp: (state, action: PayloadAction<Partial<otpState>>) => {
            state = { ...state, ...action.payload };
            return state;
        },
    },
});

export const { setOtp } = otpSlice.actions;

export default otpSlice.reducer;
