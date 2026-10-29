import { createSlice } from '@reduxjs/toolkit';

const forgotpasswordSlice = createSlice({
    name: 'forgotpassword',
    initialState: {
        step: 1,
        email: '',
    },
    reducers: {
        forgotpasswordnextStep: (state, action) => {
            state.step = 2;
            state.email = action.payload;
        },
        forgotpasswordpreviousStep: state => {
            state.step -= 1;
        },
        forgotpasswordReset: state => {
            state.step = 1;
            state.email = '';
        },
    },
});

export const { forgotpasswordnextStep, forgotpasswordpreviousStep, forgotpasswordReset } =
    forgotpasswordSlice.actions;

export const forgotpasswordReducer = forgotpasswordSlice.reducer;
