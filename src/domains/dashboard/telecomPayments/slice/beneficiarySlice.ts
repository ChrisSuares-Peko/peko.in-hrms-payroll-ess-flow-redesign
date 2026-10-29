import { PayloadAction, createSlice } from '@reduxjs/toolkit';

const initialState = {
    prepaidBeneficiary: {
        serviceProvider: '',
        providerCircle: '',
        phoneNo: '',
    },
};

export const prepaidBeneficiarySlice = createSlice({
    name: 'BenefeciaryPrepaid',
    initialState,
    reducers: {
        setPrepaidBeneficiary: (state, action: PayloadAction<Partial<any>>) => {
            state.prepaidBeneficiary = { ...state.prepaidBeneficiary, ...action.payload };
        },
        clearPrepaidBeneficiary: () => initialState,
    },
});

export const { setPrepaidBeneficiary, clearPrepaidBeneficiary } = prepaidBeneficiarySlice.actions;

export default prepaidBeneficiarySlice.reducer;
