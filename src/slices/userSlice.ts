import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { ProductTour, UserInfoResponse, notificationListResponse } from '@customtypes/general';

interface ApiState {
    user: UserInfoResponse | null;
    notifications: notificationListResponse | null;
}

const initialState: ApiState = {
    user: null,
    notifications: null,
};

export const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setUserInfo: (state, action: PayloadAction<Partial<ApiState>>) => {
            state = { ...state, ...action.payload };
            return state;
        },
        setNotifications: (state, action: PayloadAction<Partial<ApiState>>) => {
            state = { ...state, ...action.payload };
            return state;
        },
        resetNotificationCounter: state => {
            if (state.notifications) {
                state.notifications.count = 0;
            }
        },
        alterProductTour: (state, action: PayloadAction<Partial<ProductTour>>) => {
            if (state.user) {
                state.user.productTour = { ...state.user.productTour, ...action.payload };
            }
        },
        setGstandPanInfo: (state, action: PayloadAction<Partial<boolean>>) => {
            if (state.user) {
                state.user.gstVerified = action.payload;
                state.user.panVerified = action.payload;
            }
        },
        resetUser: state => {
            state = initialState;
            return state;
        },
        updatePekoCreditState: (
            state,
            action: PayloadAction<{ isPekoCreditActive: boolean; pekoCredits: string }>
        ) => {
            if (state.user) {
                state.user.isPekoCreditActive = action.payload.isPekoCreditActive;
                state.user.pekoCredits = action.payload.pekoCredits;
            }
        },
    },
});

export const {
    setUserInfo,
    setNotifications,
    resetUser,
    alterProductTour,
    setGstandPanInfo,
    resetNotificationCounter,
    updatePekoCreditState,
} = userSlice.actions;

export default userSlice.reducer;
