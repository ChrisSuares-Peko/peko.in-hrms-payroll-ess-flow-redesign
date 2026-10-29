import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { KybStage, KycStage } from '../utils/types';

/** Temporary manual role selector used on the KYC screen until role is derived from auth. */
export type CorporateCardRole = 'admin' | 'user';

/** Submission summary for the KYB status screens — populated from the real GET/POST kyb-status response. */
export interface KybInfo {
    refId: string | null;
    submittedOn: string | null;
    rejectionReason: string | null;
    kybStatus: string | null;
}

/** Submission summary for the KYC "under review" screen — populated from the real kyc/status response. */
export interface KycInfo {
    refId: string | null;
    submittedOn: string | null;
}

interface CorporateCardsState {
    kycStage: KycStage;
    viewAs: CorporateCardRole;
    kybStage: KybStage;
    businessType: string | null;
    kybInfo: KybInfo;
    kycInfo: KycInfo;
    /** Whether the employer has finished Corporate Cards KYB. `null` until asked — never assume either way. */
    cardKybComplete: boolean | null;
}

const initialState: CorporateCardsState = {
    kycStage: 'initiate',
    viewAs: 'admin',
    kybStage: 'initiate',
    businessType: null,
    kybInfo: { refId: null, submittedOn: null, rejectionReason: null, kybStatus: null },
    kycInfo: { refId: null, submittedOn: null },
    cardKybComplete: null,
};

const corporateCardsSlice = createSlice({
    name: 'corporateCards',
    initialState,
    reducers: {
        setKycStage: (state, action: PayloadAction<KycStage>) => {
            state.kycStage = action.payload;
        },
        setViewAs: (state, action: PayloadAction<CorporateCardRole>) => {
            state.viewAs = action.payload;
        },
        /** Choose a role and move into the "submitted / under review" stage in one step. */
        initiateKyc: (state, action: PayloadAction<CorporateCardRole>) => {
            state.viewAs = action.payload;
            state.kycStage = 'submitted';
        },
        setKybStage: (state, action: PayloadAction<KybStage>) => {
            state.kybStage = action.payload;
        },
        setBusinessType: (state, action: PayloadAction<string | null>) => {
            state.businessType = action.payload;
        },
        setKybInfo: (state, action: PayloadAction<KybInfo>) => {
            state.kybInfo = action.payload;
        },
        setKycInfo: (state, action: PayloadAction<KycInfo>) => {
            state.kycInfo = action.payload;
        },
        setCardKybComplete: (state, action: PayloadAction<boolean | null>) => {
            state.cardKybComplete = action.payload;
        },
        resetCorporateCardsKyc: () => initialState,
    },
});

export const {
    setKycStage,
    setViewAs,
    initiateKyc,
    setKybStage,
    setBusinessType,
    setKybInfo,
    setKycInfo,
    setCardKybComplete,
    resetCorporateCardsKyc,
} = corporateCardsSlice.actions;

export default corporateCardsSlice.reducer;
