import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { AddressField } from '../types/address';

const initialState: AddressField = {
    address: '',
    phoneNumber: '',
    remarks: '',
    firstName: '',
    lastName: '',
};

export const addressSlice = createSlice({
    name: 'addressDetails',
    initialState,
    reducers: {
        setAddressData: (state, action: PayloadAction<Partial<AddressField>>) => {
            state = { ...state, ...action.payload };
            return state;
        },
        resetAddressState: () => initialState,
    },
});

export const { setAddressData, resetAddressState } = addressSlice.actions;

export default addressSlice.reducer;
