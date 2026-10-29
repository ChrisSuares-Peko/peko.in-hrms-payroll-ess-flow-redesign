import { PayloadAction, createSlice } from '@reduxjs/toolkit';

export interface RFQDraftLineItem {
    key: string;
    description: string;
    qty: number | string;
    unit: string;
    price: number | string;
}

export interface RFQDraftAttachment {
    fileName: string;
    fileBase64: string;
    fileFormat: string;
}

export interface RFQDraftState {
    rfqId: number | null; // null = new RFQ, number = editing existing RFQ
    title: string;
    prRef: string;
    deadline: string;
    terms: string;
    notes: string;
    lineItems: RFQDraftLineItem[];
    invitedVendors: number[];
    invitedEmails: string[];
    attachments: RFQDraftAttachment[];
}

const initialState: RFQDraftState = {
    rfqId: null,
    title: '',
    prRef: '',
    deadline: '',
    terms: '',
    notes: '',
    lineItems: [],
    invitedVendors: [],
    invitedEmails: [],
    attachments: [],
};

const rfqDraftSlice = createSlice({
    name: 'rfqDraft',
    initialState,
    reducers: {
        setRFQDraft: (state, action: PayloadAction<Partial<RFQDraftState>>) => ({ ...state, ...action.payload }),
        resetRFQDraft: () => ({ ...initialState }),
    },
});

export const { setRFQDraft, resetRFQDraft } = rfqDraftSlice.actions;
export default rfqDraftSlice.reducer;
