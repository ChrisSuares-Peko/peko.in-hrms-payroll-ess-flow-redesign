// src/features/calls/redux/callSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    isCalling: false,
    callData: null,
    remoteStream: null,
    localStream: null,
    callStatus: 'idle', // idle, ringing, inCall
    callMode: 'video', // video, audio
    callRole: 'callee', // 'caller'
    isInCall: false,
};

const callSlice = createSlice({
    name: 'call',
    initialState,
    reducers: {
        setCalling(state, action) {
            state.isCalling = action.payload;
        },
        setCallData(state, action) {
            state.callData = action.payload;
        },
        setRemoteStream(state, action) {
            state.remoteStream = action.payload;
        },
        setLocalStream(state, action) {
            state.localStream = action.payload;
        },
        setCallStatus(state, action) {
            state.callStatus = action.payload;
        },
        setCallMode(state, action) {
            state.callMode = action.payload;
        },
        setCallRole(state, action) {
            state.callRole = action.payload;
        },
        setIsInCall(state, action) {
            state.isInCall = action.payload;
        },
    },
});

export const {
    setCalling,
    setCallData,
    setRemoteStream,
    setLocalStream,
    setCallStatus,
    setCallMode,
    setCallRole,
    setIsInCall,
} = callSlice.actions;
export default callSlice.reducer;
