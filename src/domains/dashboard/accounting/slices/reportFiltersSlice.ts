import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { FINANCIAL_YEARS, PERIOD_OPTIONS } from '../utils/reportFilters';

interface ReportFiltersState {
    financialYear: string;
    period: string;
}

const initialState: ReportFiltersState = {
    financialYear: FINANCIAL_YEARS[0],
    period: PERIOD_OPTIONS[0].value,
};

const reportFiltersSlice = createSlice({
    name: 'accountingReportFilters',
    initialState,
    reducers: {
        setReportFinancialYear: (state, action: PayloadAction<string>) => {
            state.financialYear = action.payload;
        },
        setReportPeriod: (state, action: PayloadAction<string>) => {
            state.period = action.payload;
        },
    },
});

export const { setReportFinancialYear, setReportPeriod } = reportFiltersSlice.actions;
export default reportFiltersSlice.reducer;
