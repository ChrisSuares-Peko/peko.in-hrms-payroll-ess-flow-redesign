import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    id: null,
    level: 1,
    minLength: 8,
    minPasswordAge: 0,
    maxPasswordAge: 0,
    minChangeChars: 0,
    prohibitPasswordReuse: false,
    prohibitPasswordReuseTimes: 0,
    maxInvalidLoginAttempts: 0,
    lockEffectivePeriod: 0,
    lockoutTimespan: 0,
    enableBannedPasswords: false,
    customBannedPasswords: '',
    preventPersonalDataInPassword: false,
    createdAt: '',
    updatedAt: '',
};

const passwordPolicySlice = createSlice({
    name: 'passwordPolicy',
    initialState,
    reducers: {
        setPasswordPolicy: (state, action) => action.payload[0],
        resetPasswordPolicy: () => initialState,
    },
});

export const { setPasswordPolicy, resetPasswordPolicy } = passwordPolicySlice.actions;
export default passwordPolicySlice.reducer;
