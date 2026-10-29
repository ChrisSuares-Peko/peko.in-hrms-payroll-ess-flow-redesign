import { PayloadAction, createSlice } from '@reduxjs/toolkit';

interface chatState {
    chatId: string;
    sessionId: string;
}

const initialState: chatState = {
    chatId: '',
    sessionId: '',
};

export const chatSlice = createSlice({
    name: 'freshchat',
    initialState,
    reducers: {
        setChat: (state, action: PayloadAction<Partial<chatState>>) => {
            state = { ...state, ...action.payload };
            return state;
        },
    },
});

export const { setChat } = chatSlice.actions;

export default chatSlice.reducer;
