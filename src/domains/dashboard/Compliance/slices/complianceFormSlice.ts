import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type CompanyInfoValue = string | string[] | boolean | Record<string, string | boolean>[];

export interface SavedDocument {
    key: string;
    name: string;
    base64: string;
    mimeType: string;
}

export interface DraftState {
    currentStep: number;
    companyInfo: Record<string, CompanyInfoValue>;
    documents: SavedDocument[];
}

interface ComplianceFormState {
    activeDraftType: string;
    drafts: Record<string, DraftState>;
}

export const initialDraft: DraftState = { currentStep: 0, companyInfo: {}, documents: [] };

const EMPTY_DRAFTS: Record<string, DraftState> = {};

const initialState: ComplianceFormState = {
    activeDraftType: '',
    drafts: {},
};

// Ensures drafts map exists (guards against stale persisted state from old slice shape)
const ensureDrafts = (state: ComplianceFormState) => {
    if (!state.drafts) state.drafts = {};
};

const getOrInitDraft = (state: ComplianceFormState): DraftState => {
    ensureDrafts(state);
    if (!state.activeDraftType) return initialDraft;
    if (!state.drafts[state.activeDraftType]) {
        state.drafts[state.activeDraftType] = { ...initialDraft };
    }
    return state.drafts[state.activeDraftType];
};

const complianceFormSlice = createSlice({
    name: 'complianceForm',
    initialState,
    reducers: {
        setActiveDraftType: (state, action: PayloadAction<string>) => {
            ensureDrafts(state);
            state.activeDraftType = action.payload;
            if (action.payload && !state.drafts[action.payload]) {
                state.drafts[action.payload] = { ...initialDraft };
            }
        },
        setComplianceFormStep: (state, action: PayloadAction<number>) => {
            const draft = getOrInitDraft(state);
            if (draft !== initialDraft) draft.currentStep = action.payload;
        },
        setComplianceType: (state, action: PayloadAction<string>) => {
            ensureDrafts(state);
            state.activeDraftType = action.payload;
            if (action.payload && !state.drafts[action.payload]) {
                state.drafts[action.payload] = { ...initialDraft };
            }
        },
        setComplianceCompanyInfo: (state, action: PayloadAction<Record<string, CompanyInfoValue>>) => {
            const draft = getOrInitDraft(state);
            if (draft !== initialDraft) draft.companyInfo = action.payload;
        },
        setComplianceDocuments: (state, action: PayloadAction<SavedDocument[]>) => {
            const draft = getOrInitDraft(state);
            if (draft !== initialDraft) draft.documents = action.payload;
        },
        clearDraft: (state, action: PayloadAction<string>) => {
            ensureDrafts(state);
            delete state.drafts[action.payload];
            if (state.activeDraftType === action.payload) state.activeDraftType = '';
        },
        resetComplianceForm: () => initialState,
    },
});

export const {
    setActiveDraftType,
    setComplianceFormStep,
    setComplianceType,
    setComplianceCompanyInfo,
    setComplianceDocuments,
    clearDraft,
    resetComplianceForm,
} = complianceFormSlice.actions;

export const selectActiveDraft = (state: any): DraftState => {
    const cf = state.reducer.complianceForm;
    return (cf.drafts ?? EMPTY_DRAFTS)[cf.activeDraftType] ?? initialDraft;
};

// Returns the same EMPTY_DRAFTS reference when no drafts exist, avoiding spurious rerenders
export const selectAllDrafts = (state: any): Record<string, DraftState> =>
    state.reducer.complianceForm.drafts ?? EMPTY_DRAFTS;

export default complianceFormSlice.reducer;
