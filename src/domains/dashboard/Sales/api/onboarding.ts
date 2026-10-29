import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { VirtualAccountResponse } from '../types/onboarding';

export const getPaymentOnboardingStatus = async (payload: UserPayload) => {
    try {
        const { userId, userType } = payload;
        const resp: SuccessGenericResponse<VirtualAccountResponse> = await ApiClient.get(
            `${userType}/${userId}/payment/payment-links/onboarding/status`
        );
        return resp;
    } catch {
        return false;
    }
};

export const savePaymentOnboardingStep1Api = async (
    payload: UserPayload & {
        businessName: string;
        bankName?: string;
        accountNumber?: string;
        ifsc?: string;
    }
) => {
    try {
        const { userId, userType, ...body } = payload;
        const resp: SuccessGenericResponse<{}> = await ApiClient.post(
            `${userType}/${userId}/payment/payment-links/onboarding/step-1`,
            body
        );
        return resp;
    } catch (error) {
        return (error as any)?.response?.data ?? false;
    }
};

export const savePaymentOnboardingPanApi = async (payload: UserPayload & { pan: string }) => {
    try {
        const { userId, userType, ...body } = payload;
        const resp: SuccessGenericResponse<{ phone?: string }> = await ApiClient.post(
            `${userType}/${userId}/payment/payment-links/onboarding/step-pan`,
            body
        );
        return resp;
    } catch (error) {
        return (error as any)?.response?.data ?? false;
    }
};

export const savePaymentOnboardingBankApi = async (
    payload: UserPayload & {
        accountNumber: string;
        bankName: string;
        ifsc: string;
        name: string;
        phone: string;
    }
) => {
    try {
        const { userId, userType, ...body } = payload;
        const resp: SuccessGenericResponse<{
            bankName: string;
            accountNumber: string;
            ifsc: string;
            accountHolderName: string | null;
            phone: string | null;
        }> = await ApiClient.post(
            `${userType}/${userId}/payment/payment-links/onboarding/step-bank`,
            body
        );
        return resp;
    } catch (error) {
        return (error as any)?.response?.data ?? false;
    }
};

export const savePaymentOnboardingStep2Api = async (
    payload: UserPayload & { consentAccepted: boolean }
) => {
    try {
        const { userId, userType, ...body } = payload;
        const resp: SuccessGenericResponse<{ virtualAccountNumber?: string }> =
            await ApiClient.post(
                `${userType}/${userId}/payment/payment-links/onboarding/step-2`,
                body
            );
        return resp;
    } catch (error) {
        return (error as any)?.response?.data ?? false;
    }
};
