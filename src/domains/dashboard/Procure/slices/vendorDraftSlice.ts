import { PayloadAction, createSlice } from '@reduxjs/toolkit';

export interface VendorDraftState {
    businessName: string;
    gstin: string;
    contactPerson: string;
    email: string;
    phone: string;
    tags: string[];
    paymentTerms: string;
    status: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
}

const initialState: VendorDraftState = {
    businessName: '',
    gstin: '',
    contactPerson: '',
    email: '',
    phone: '',
    tags: [],
    paymentTerms: '',
    status: 'Active',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
};

const vendorDraftSlice = createSlice({
    name: 'vendorDraft',
    initialState,
    reducers: {
        setVendorDraft: (state, action: PayloadAction<Partial<VendorDraftState>>) => ({ ...state, ...action.payload }),
        resetVendorDraft: () => ({ ...initialState }),
    },
});

export const { setVendorDraft, resetVendorDraft } = vendorDraftSlice.actions;
export default vendorDraftSlice.reducer;
