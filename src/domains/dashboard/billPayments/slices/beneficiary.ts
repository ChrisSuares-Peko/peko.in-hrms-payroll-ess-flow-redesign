import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { Beneficiary } from '../../telecomPayments/types';

export interface BeneficiaryState {
    beneficiaryData: Beneficiary[] | [];
    isLoading: boolean;
    refresh: boolean;
    formIntialValues: { [key: string]: string };
    complaintResponse: any;
}

const initialState: BeneficiaryState = {
    beneficiaryData: [],
    isLoading: false,
    refresh: false,
    formIntialValues: {},
    complaintResponse: {},
};

export const beneficiarySlice = createSlice({
    name: 'beneficiary',
    initialState,
    reducers: {
        setData: (state, action: PayloadAction<Partial<BeneficiaryState>>) => {
            state = { ...state, ...action.payload };
            return state;
        },
        setFormInitialValues: (state, action: PayloadAction<{ [key: string]: string }>) => {
            state.formIntialValues = action.payload;
        },
        setComplaintResponse: (state, action: PayloadAction<any>) => {
            state.complaintResponse = action.payload;
        },
    },
});

export const { setData, setFormInitialValues, setComplaintResponse } = beneficiarySlice.actions;

export default beneficiarySlice.reducer;
