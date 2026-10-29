import { PayloadAction, createSlice } from '@reduxjs/toolkit';

interface EInvoiceAuthState {
    authToken: string | null;
    tokenExpiry: string | null;
    gstin: string | null;
    clientId: string | null;
    forcedLogout: boolean;
}

const initialState: EInvoiceAuthState = {
    authToken: null,
    tokenExpiry: null,
    gstin: null,
    clientId: null,
    forcedLogout: false,
};

export const eInvoiceAuthSlice = createSlice({
    name: 'eInvoiceAuth',
    initialState,
    reducers: {
        setEInvoiceAuth: (state, action: PayloadAction<Partial<EInvoiceAuthState>>) => ({ ...state, ...action.payload }),
        clearEInvoiceAuth: () => initialState,
        setForcedLogout: (state, action: PayloadAction<boolean>) => ({ ...state, forcedLogout: action.payload }),
    },
});

export const { setEInvoiceAuth, clearEInvoiceAuth, setForcedLogout } = eInvoiceAuthSlice.actions;
export default eInvoiceAuthSlice.reducer;
