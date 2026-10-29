import { PayloadAction, createSlice } from '@reduxjs/toolkit';

export interface PRLineItem {
    key: string;
    itemName: string;
    qty: number | string;
    unit: string;
    estUnitCost: number | string;
}

export interface PurchaseRequestDraftState {
    requestedBy: string;
    department: string;
    category: string;
    neededBy: string;
    lineItems: PRLineItem[];
    notes: string;
    attachments: { fileName: string; fileBase64: string; fileFormat: string }[];
}

const initialState: PurchaseRequestDraftState = {
    requestedBy: '',
    department: '',
    category: '',
    neededBy: '',
    lineItems: [],
    notes: '',
    attachments: [],
};

const purchaseRequestDraftSlice = createSlice({
    name: 'purchaseRequestDraft',
    initialState,
    reducers: {
        setPurchaseRequestDraft: (state, action: PayloadAction<Partial<PurchaseRequestDraftState>>) => ({ ...state, ...action.payload }),
        resetPurchaseRequestDraft: () => ({ ...initialState }),
    },
});

export const { setPurchaseRequestDraft, resetPurchaseRequestDraft } = purchaseRequestDraftSlice.actions;
export default purchaseRequestDraftSlice.reducer;
