import { PayloadAction, createSlice } from '@reduxjs/toolkit';

interface WhatsappBusinessState {
    amount: string;
    projectId: string;
}

const initialState: WhatsappBusinessState = {
    amount: '',
    projectId: '',
};

const whatsappBusinessSlice = createSlice({
    name: 'whatsappBusiness',
    initialState,
    reducers: {
        setAmount: (state, action: PayloadAction<string>) => {
            state.amount = action.payload;
        },
        setProjectId: (state, action: PayloadAction<string>) => {
            state.projectId = action.payload;
        },
        resetWhatsappBusinessState: () => initialState,
    },
});

export const { setAmount, setProjectId, resetWhatsappBusinessState } =
    whatsappBusinessSlice.actions;
export default whatsappBusinessSlice.reducer;
