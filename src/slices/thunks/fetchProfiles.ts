import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

import { SERVER_URL } from '@src/config-global';
import { RootState } from '@store/store';

export const fetchProfiles = createAsyncThunk('chat/profiles', async (_, { getState }) => {
    const { token, sessionId } = (getState() as RootState).reducer.auth;
    const { data } = await axios.get(`${SERVER_URL}/user/chat/profile`, {
        headers: {
            Authorization: `Bearer ${token}`,
            sessionid: sessionId,
        },
    });
    return data.data.profiles;
});
