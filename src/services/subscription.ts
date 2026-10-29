import {
    ActivateCodeResponse,
    SubscriptionAddOnResponse,
    subscriptionCodeResponse,
    subscriptionHistoryResponse,
    SuccessGenericResponse,
    UserPayload,
} from '@customtypes/general';
import { SelectedType } from '@src/domains/dashboard/plans/types';

import { ApiClient } from './config';

export const getAddonDetails = async (accessKey: string) => {
    try {
        const resp: SuccessGenericResponse<SubscriptionAddOnResponse> = await ApiClient.get(
            `user/subscription/add-ons?accessKey=${accessKey}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getSubscriptionHistory = async (accessCode: string) => {
    try {
        const resp: SuccessGenericResponse<subscriptionHistoryResponse> = await ApiClient.get(
            `user/subscription/history?accessCode=${accessCode}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const checkCouponCode = async (
    payload: UserPayload & { activationCode: string; packageId: number; selectedType: SelectedType }
) => {
    try {
        const { userId, userType, activationCode, packageId, selectedType } = payload;
        const resp: SuccessGenericResponse<subscriptionCodeResponse> = await ApiClient.post(
            `${userType}/${userId}/purchase/subscription/validate-code`,
            { activationCode, packageId, billingType: selectedType }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const activateCouponCode = async (
    payload: UserPayload & { activationCode: string; packageId: number; selectedType: SelectedType }
) => {
    try {
        const { userId, userType, activationCode, packageId, selectedType } = payload;
        const resp: SuccessGenericResponse<ActivateCodeResponse> = await ApiClient.post(
            `${userType}/${userId}/purchase/subscription/apply-code`,
            { activationCode, packageId, billingType: selectedType }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
