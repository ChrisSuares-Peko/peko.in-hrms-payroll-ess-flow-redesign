import { PayloadAction, createSlice } from '@reduxjs/toolkit';

interface InitialState {
    paymentResponse: {
        amount: number;
        corporateTxnId: number;
        datetime: string;
        corporateFinalBalance: any;
    };
    Amount: string;
}
const initialState: InitialState = {
    paymentResponse: {
        amount: 0,
        corporateTxnId: 0,
        datetime: '',
        corporateFinalBalance: '',
    },
    Amount: '',
};

export const walletSlice = createSlice({
    name: 'pekoWallet',
    initialState,
    reducers: {
        setPaymentResponse: (state, action: PayloadAction<any>) => {
            state.paymentResponse = action.payload;
        },
        setAmount: (state, action: PayloadAction<any>) => {
            state.Amount = action.payload;
        },
        resetAmount: state => {
            state.Amount = initialState.Amount;
            return state;
        },
    },
});

export const { setPaymentResponse, setAmount, resetAmount } = walletSlice.actions;
export default walletSlice.reducer;
