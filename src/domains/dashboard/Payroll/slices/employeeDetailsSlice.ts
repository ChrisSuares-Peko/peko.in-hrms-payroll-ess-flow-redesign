import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface StatutoryField {
    title: string;
    isActive: boolean;
    fields: Record<string, string>[];
}

type StatutoryData = StatutoryField[];

const initialState: {
    statutoryData: StatutoryData;
    isLoading: boolean;
} = {
    statutoryData: [],
    isLoading: false,
};

const GetEmployeeSlices = createSlice({
    name: 'GetemployeeDetails',
    initialState,
    reducers: {
        setStatutoryData: (state, action: PayloadAction<StatutoryData>) => {
            state.statutoryData = action.payload;
        },
        updateStatutoryField: (
            state,
            action: PayloadAction<{ title: string; isActive: boolean }>
        ) => {
            const { title, isActive } = action.payload;
            const idx = state.statutoryData.findIndex(s => s.title === title);
            if (idx !== -1) {
                state.statutoryData[idx].isActive = isActive;
            }
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
        resetData: () => initialState,
    },
});

export const { resetData, setStatutoryData, updateStatutoryField, setLoading } =
    GetEmployeeSlices.actions;

export default GetEmployeeSlices.reducer;
