import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { RegisterUserState } from '../types/index';

const initialState = {
    step: 1,
    signupType: 'NEW_COMPANY' as 'NEW_COMPANY' | 'EXISTING_COMPANY' | 'FREELANCER' | 'COMPLIANCE_HEALTH',
    formData: {
        name: '',
        contactPersonName: '',
        phonenumber: '',
        email: '',
        state: '',
        password: '',
        referralCode: '',
        accountType: '',
        signupType: undefined as 'NEW_COMPANY' | 'EXISTING_COMPANY' | 'FREELANCER' | 'COMPLIANCE_HEALTH' | undefined,
        marketingConsent: false,
       policyIds: {} as Record<number, boolean>,
    },
    loginData: {
        token: '',
        refreshToken: '',
        role: '',
        id: 0,
        username: '',
        roleName: '',
    },
    EmailVerificationData: {
        email: '',
        id: '',
    },
};

const registrationSlice = createSlice({
    name: 'registration',
    initialState,
    reducers: {
        nextStep: state => {
            state.step += 1;
        },
        setSignupType: (state, action: PayloadAction<'NEW_COMPANY' | 'EXISTING_COMPANY' | 'FREELANCER' | 'COMPLIANCE_HEALTH'>) => {
            state.signupType = action.payload;
        },
        previousStep: (state, action: PayloadAction<number | undefined>) => {
            if (action.payload !== undefined) {
                state.step = action.payload;
            } else {
                state.step -= 1;
            }
        },
        setFormData: (state, action: PayloadAction<RegisterUserState>) => {
            state.formData = { ...state.formData, ...action.payload };
        },
        setLoginData: (state, action: PayloadAction<RegisterUserState>) => {
            state.loginData = { ...state.loginData, ...action.payload };
        },
        setEmailVerificationData: (state, action: PayloadAction<RegisterUserState>) => {
            state.EmailVerificationData = { ...state.EmailVerificationData, ...action.payload };
        },
        resetRegisterState: () => initialState,
    },
});

export const {
    nextStep,
    previousStep,
    setSignupType,
    setFormData,
    resetRegisterState,
    setLoginData,
    setEmailVerificationData,
} = registrationSlice.actions;
export default registrationSlice.reducer;
