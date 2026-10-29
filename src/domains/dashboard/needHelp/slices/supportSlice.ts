import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { ModuleOption, IssueOption, ticketListingTableData } from '../types/type';

interface SupportState {
    moduleDetails: ModuleOption[];
    issueDetails: IssueOption[];
    tableDetails: ticketListingTableData[];
}
const initialState: SupportState = {
    moduleDetails: [],
    issueDetails: [],
    tableDetails: [],
};

const supportSlice = createSlice({
    name: 'support',
    initialState,
    reducers: {
        setModuleData: (state, action: PayloadAction<ModuleOption[]>) => {
            state.moduleDetails = action.payload;
        },
        setIssueData: (state, action: PayloadAction<IssueOption[]>) => {
            state.issueDetails = action.payload;
        },
        setTicketData: (state, action: PayloadAction<ticketListingTableData[]>) => {
            state.tableDetails = [...state.tableDetails, ...action.payload];
        },

        resetPaymentState: () => initialState,
    },
});

export const { setModuleData, resetPaymentState, setIssueData, setTicketData } =
    supportSlice.actions;
export default supportSlice.reducer;
