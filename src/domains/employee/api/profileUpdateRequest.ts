import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { OnboardingScope } from './onboarding';

export interface ProfileUpdatePayload {
    mobileNumber: string;
    addressLine1: string;
    addressLine2?: string;
    state?: string;
    country?: string;
    pinCode?: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
}

export interface BankUpdatePayload {
    bankName: string;
    ifscCode: string;
    accountNumber: string;
}

const base = ({ userType, userId }: OnboardingScope) => `${userType}/${userId}/payroll`;

export const requestProfileUpdate = async (scope: OnboardingScope, body: ProfileUpdatePayload) => {
    const resp: SuccessGenericResponse<unknown> = await ApiClient.post(
        `${base(scope)}/profile-update-requests/profile`,
        body
    );
    return resp.data;
};

export const requestBankUpdate = async (scope: OnboardingScope, body: BankUpdatePayload) => {
    const resp: SuccessGenericResponse<unknown> = await ApiClient.post(
        `${base(scope)}/profile-update-requests/bank`,
        body
    );
    return resp.data;
};
