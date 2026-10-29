import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { PAYROLL_SEEDED_PROGRESS } from '@src/prototype/payrollSeed';

interface ProgressState {
    departmentAndEmployees: boolean;
    progress: string;
    leaveandAttendance: boolean;
    payrollSettings: boolean;
    complianceSettings: boolean;
    showDashboard: boolean;
    isPurchased: boolean;
    hasBasicSalaryComponent: boolean;
    basicSalaryAmount: number;
    onBoardStatus: number;
    isSkippedDasboard: boolean;
    numberOfDaysWorking: number;
    // null for corporate accounts that predate this field — treated as exempt (existing user).
    hasSalaryRolloutSetup: boolean | null;
}

// PROTOTYPE-SETUP: seeded as set up + purchased so /payroll opens on the dashboard without a backend
// (original defaults: progress '0%', everything false/0, hasSalaryRolloutSetup null).
const initialState: ProgressState = { ...PAYROLL_SEEDED_PROGRESS };

export const payrollAuthSlice = createSlice({
    name: 'payrollAuth',
    initialState,
    reducers: {
        setPayrollProgress: (state, action: PayloadAction<Partial<ProgressState>>) => {
            state = { ...state, ...action.payload };
            return state;
        },
    },
});

export const { setPayrollProgress } = payrollAuthSlice.actions;

// PROTOTYPE-SETUP: exported so store.ts can re-apply the seeded state on rehydration.
export const payrollAuthInitialState = initialState;

export default payrollAuthSlice.reducer;
