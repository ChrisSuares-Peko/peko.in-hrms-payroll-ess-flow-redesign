import { PayloadAction, createSlice } from '@reduxjs/toolkit';

interface UpdateActiveTabPayload {
    key: string;
    value: string;
}

const initialState: Record<string, string> = {
    // Corporate side ....
    corporateTravelActiveTab: '1',
    airLineManageBookingActiveTab: '1',

    // Admin side ....
    adminReportActiveTab: '1',
};

export const activeTabSlice = createSlice({
    name: 'activeTab',
    initialState,
    reducers: {
        resetActiveTab: () => initialState,
        updateActiveTab: (state, action: PayloadAction<UpdateActiveTabPayload>) => {
            const { key, value } = action.payload;
            state[key] = value; // Dynamically update the key
        },
    },
});

export const { resetActiveTab, updateActiveTab } = activeTabSlice.actions;

export default activeTabSlice.reducer;
