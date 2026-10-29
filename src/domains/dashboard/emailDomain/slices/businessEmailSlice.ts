import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { EmailDomainFormData } from '../types/types';

const initialState: EmailDomainFormData = {
    companyName: '',
    currentEmailProvider: '',
    numberOfUsers: 0,
    name: '',
    domainName: '',
    emailId: '',
    alternativeEmailId: '',
    mobileNumber: '',
    companyAddress: '',
    emirates: '',
    city: '',
    zipcode: '',
    selectedProductId: null,
};

export const businessEmailSlice = createSlice({
    name: 'businessEmail',
    initialState,
    reducers: {
        setData: (state, action: PayloadAction<Partial<EmailDomainFormData>>) => ({
            ...state,
            ...action.payload,
        }),
        setSelectedProductId: (state, action: PayloadAction<number>) => {
            state.selectedProductId = action.payload;
        },
        clearData: () => initialState,
    },
});

export const { setData, clearData, setSelectedProductId } = businessEmailSlice.actions;

export default businessEmailSlice.reducer;
