import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { ESignDocState, SignerCoordinate } from '../types';

const initialState: ESignDocState = {
    docket_title: '',
    expiry_date: '',
    reminder: false,
    reminder_interval: '',
    documentBase64: '',
    document_url: '',
    audit_trail_url: '',
    sequentialSignature: false,
    signingPolicy: 'QUICKSIGN',
    signers_info: [],
    saved_signers: [],
    initiator_name: '',
    initiator_email: '',
    isDisabled: false,
    status: '',
    pageNumbers: null,
    doc_expiry_date: '',
    id: '',
    signerCoordinates: [],
    signerCo: {},
    termsofUse: false,
    signerArray: ['0'],
};

export const eSignDocSlice = createSlice({
    name: 'eSignDoc',
    initialState,
    reducers: {
        setESignDocData: (state, action: PayloadAction<Partial<ESignDocState>>) => ({
            ...state,
            ...action.payload,
        }),
        updateSignerCoordinate: (
            state,
            action: PayloadAction<{
                key: string;
                id: string;
                updatedCoordinate: {
                    x1: number;
                    x2: number;
                    y1: number;
                    y2: number;
                    page: number;
                    pageHeight: number;
                    pageWidth: number;
                };
            }>
        ) => {
            const { key, id, updatedCoordinate } = action.payload;
            if (state.signerCo[key]) {
                const signerIndex = state.signerCo[key].findIndex(signer => signer.id === id);
                if (signerIndex !== -1) {
                    state.signerCo[key][signerIndex] = {
                        ...state.signerCo[key][signerIndex],
                        ...updatedCoordinate,
                    };
                }
            }
        },
        addSignerCoordinate: (
            state,
            action: PayloadAction<{ key: string; data: SignerCoordinate }>
        ) => {
            const { key, data } = action.payload;
            if (!state.signerCo[key]) {
                state.signerCo[key] = [];
            }
            state.signerCo[key].push(data);
        },

        removeSignerArray: (state, action: PayloadAction<number>) => {
            const keyToRemove = action.payload;

            if (state.signerCo[keyToRemove]) {
                delete state.signerCo[keyToRemove];
            }
            const sortedKeys = Object.keys(state.signerCo)
                .map(key => Number(key))
                .sort((a, b) => a - b);
            sortedKeys.forEach(key => {
                if (key >= keyToRemove) {
                    state.signerCo[key - 1] = state.signerCo[key];
                    delete state.signerCo[key];
                }
            });
        },
        removeSignerObject: (state, action: PayloadAction<{ key: number; id: string }>) => {
            const { key, id } = action.payload;
            if (state.signerCo[key]) {
                state.signerCo[key] = state.signerCo[key].filter(obj => obj.id !== id);
            }
        },
        clearSignerCoordinates: state => {
            state.signerCo = {};
        },
        clearESignDocData: () => initialState,
        addSigner: state => {
            if (Array.isArray(state.signerArray)) {
                const nextSigner = state.signerArray.length.toString();
                state.signerArray.push(nextSigner);
            }
        },
        setRemoveSigner: (state, action: PayloadAction<string>) => {
            if (Array.isArray(state.signerArray)) {
                const signerToRemove = action.payload;
                state.signerArray = state.signerArray.filter(signer => signer !== signerToRemove);
                state.signerArray = state.signerArray.map((_, index) => index.toString());
            }
        },
        clearSignerArray: state => {
            state.signerArray = ['0'];
        },
    },
});

export const {
    setESignDocData,
    clearESignDocData,
    addSignerCoordinate,
    removeSignerArray,
    removeSignerObject,
    updateSignerCoordinate,
    clearSignerCoordinates,
    addSigner,
    setRemoveSigner,
    clearSignerArray,
} = eSignDocSlice.actions;

export default eSignDocSlice.reducer;
