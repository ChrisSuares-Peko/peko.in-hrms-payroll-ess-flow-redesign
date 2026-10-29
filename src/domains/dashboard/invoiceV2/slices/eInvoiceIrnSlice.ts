import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { GenerateIrnFormState } from '../types/generateIrn';

interface EInvoiceIrnState {
    prefilled: GenerateIrnFormState | null;
}

const initialState: EInvoiceIrnState = {
    prefilled: null,
};

export const eInvoiceIrnSlice = createSlice({
    name: 'eInvoiceIrn',
    initialState,
    reducers: {
        setPrefilledIrn: (state, action: PayloadAction<GenerateIrnFormState>) => {
            state.prefilled = action.payload;
        },
        clearPrefilledIrn: state => {
            state.prefilled = null;
        },
    },
});

export const { setPrefilledIrn, clearPrefilledIrn } = eInvoiceIrnSlice.actions;
export default eInvoiceIrnSlice.reducer;
