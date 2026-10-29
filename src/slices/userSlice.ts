import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { ProductTour, UserInfoResponse, notificationListResponse } from '@customtypes/general';
import { MOCK_AUTHENTICATED_USER } from '@domains/auth/slices/loginSlice';

interface ApiState {
    user: UserInfoResponse | null;
    notifications: notificationListResponse | null;
}

// PROTOTYPE-SETUP: user info is derived from the single auth mock instead of fetched from walletDetails.
const MOCK_USER_INFO: UserInfoResponse = {
    balance: '0',
    credentialId: MOCK_AUTHENTICATED_USER.id,
    role: MOCK_AUTHENTICATED_USER.role,
    companyName: MOCK_AUTHENTICATED_USER.name ?? '',
    roleName: MOCK_AUTHENTICATED_USER.roleName,
    username: MOCK_AUTHENTICATED_USER.username,
    logo: '',
    // PROTOTYPE-SETUP: product tours off (the antd <Tour> in Payroll's Dash is gated by productTour.payroll).
    productTour: { dashboard: false, payroll: false },
    gstVerified: true,
    panVerified: true,
    contactPersonName: MOCK_AUTHENTICATED_USER.contactPersonName ?? '',
    email: MOCK_AUTHENTICATED_USER.email ?? '',
    mobileNo: MOCK_AUTHENTICATED_USER.mobileNo ?? '',
    chatId: '',
    accountType: 'corporate',
};

const initialState: ApiState = {
    user: MOCK_USER_INFO,
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
