import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    selfTransferPayload,
    selfTransferResponse,
    transferFundsResponse,
    UserPayload,
    walletDetailsResponse,
} from '../types/SelfTransferTypes';

export const selfTransferApi = async ({
    userType,
    userId,
    idempotencyKey,
    ...payload
}: selfTransferPayload) => {
    try {
        const res: SuccessGenericResponse<selfTransferResponse> = await ApiClient.post(
            `${userType}/${userId}/others/selfTransfer/`,
            {
                ...payload,
            },
            { headers: { 'Idempotency-Key': idempotencyKey } }
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const fetchWalletDetails = async ({ userId, userType }: UserPayload) => {
    try {
        const res: SuccessGenericResponse<walletDetailsResponse> = await ApiClient.get(
            `${userType}/${userId}/others/profile/walletDetails`
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const transferFundsApi = async ({
    userType,
    userId,
    idempotencyKey,
    ...payload
}: selfTransferPayload) => {
    try {
        const res: SuccessGenericResponse<transferFundsResponse> = await ApiClient.post(
            `${userType}/${userId}/others/transferFunds/`,
            {
                ...payload,
            },
            { headers: { 'Idempotency-Key': idempotencyKey } }
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
