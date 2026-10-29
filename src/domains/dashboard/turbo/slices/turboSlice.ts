import { PayloadAction, createSlice } from '@reduxjs/toolkit';

interface InitialState {
    verifyResponse: any;
    verifyRcResponse: any;
    inputParams: any;
}
const initialState: InitialState = {
    verifyResponse: {},
    verifyRcResponse: {},
    inputParams: {},
};

export const turboSlice = createSlice({
    name: 'turbo',
    initialState,
    reducers: {
        setverifyResponse: (state, action: PayloadAction<any>) => {
            state.verifyResponse = action.payload;
        },
        setRcVerifyResponse: (state, action: PayloadAction<any>) => {
            state.verifyRcResponse = action.payload;
        },
        resetRcResponse: state => {
            state.verifyRcResponse = initialState.verifyRcResponse;
            return state;
        },

        resetResponse: state => {
            state.verifyResponse = initialState.verifyResponse;
            return state;
        },
        setInputParams: (state, action: PayloadAction<any>) => {
            state.inputParams = action.payload;
        },
        resetInputParams: state => {
            state.inputParams = initialState.inputParams;
            return state;
        },
    },
});

export const {
    setverifyResponse,
    setRcVerifyResponse,
    setInputParams,
    resetRcResponse,
    resetResponse,
    resetInputParams,
} = turboSlice.actions;
export default turboSlice.reducer;
