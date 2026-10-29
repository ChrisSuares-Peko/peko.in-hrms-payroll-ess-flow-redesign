import { PayloadAction, createSlice } from '@reduxjs/toolkit';

interface InitialState {
    verificationResponse: any;
}
const initialState: InitialState = {
    verificationResponse: {},
};

export const verificationSlice = createSlice({
    name: 'verificationSuite',
    initialState,
    reducers: {
        setverificationResponse: (state, action: PayloadAction<any>) => {
            state.verificationResponse = action.payload;
        },
    },
});

export const { setverificationResponse } = verificationSlice.actions;
export default verificationSlice.reducer;
