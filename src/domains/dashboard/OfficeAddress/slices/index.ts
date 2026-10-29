import { PayloadAction, createSlice } from '@reduxjs/toolkit';

interface PlanState {
    planId: number;
    amount: string | number;
    planName: string;
    workspaceId: number | null;
}

const initialState: PlanState = {
    planId: 0,
    amount: 0,
    planName: '',
    workspaceId: null,
};

export const planSlice = createSlice({
    name: 'plan',
    initialState,
    reducers: {
        setPlanData: (state, action: PayloadAction<PlanState>) => {
            state = { ...state, ...action.payload };
            return state;
        },
    },
});

export const { setPlanData } = planSlice.actions;

export default planSlice.reducer;
