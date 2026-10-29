import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { ChatState } from '@customtypes/general';

const initialState: ChatState = {
    chats: [],
    profiles: [],
    isLoading: false,
    error: null,
    status: 'idle',
    unreadChats: 0,
    notification: null,
    notifications: [],
    acsUserId: '',
    page: 'chat',
    mode: '',
    pendingRequests: 0,
};

const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        setPendingRequests: (state, action: PayloadAction<number>) => {
            state.pendingRequests = action.payload;
        },
    },
});

export const { setPendingRequests } = chatSlice.actions;

export default chatSlice.reducer;
