import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { CtcDeductionComponent, CtcEarningComponent } from '../utils/ctcCalculator/types';

export interface CtcCalculatorDraft {
    annualCTC: number;
    earnings: CtcEarningComponent[];
    deductions: CtcDeductionComponent[];
}

interface CtcCalculatorDraftState {
    draft: CtcCalculatorDraft | null;
}

const initialState: CtcCalculatorDraftState = {
    draft: null,
};

// Holds the session-local structure "Use this for a New Hire" carries from the standalone
// CTC Calculator into the Add Employee Salary Information step. Consumed once, then cleared.
export const ctcCalculatorDraftSlice = createSlice({
    name: 'ctcCalculatorDraft',
    initialState,
    reducers: {
        setCtcDraft: (state, action: PayloadAction<CtcCalculatorDraft>) => {
            state.draft = action.payload;
        },
        clearCtcDraft: state => {
            state.draft = null;
        },
    },
});

export const { setCtcDraft, clearCtcDraft } = ctcCalculatorDraftSlice.actions;

export default ctcCalculatorDraftSlice.reducer;
