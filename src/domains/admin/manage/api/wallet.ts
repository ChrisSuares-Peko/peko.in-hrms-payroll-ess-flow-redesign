import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { Denominations } from '../types/types';
import { UserPayload } from '../types/vendorPayout';

export const getWalletDenomination = async ({ userId, userType }: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<PaymentResponse> = await ApiClient.get(
            `${userType}/${userId}/others/peko-wallet`
        );
        const { data } = resp;

        return data;
    } catch (err) {
        return false;
    }
};

export const updateWalletDenomination = async ({
    userId,
    userType,
    ...payload
}: UserPayload & { denominations: Denominations }) => {
    try {
        const resp: SuccessGenericResponse<PaymentResponse> = await ApiClient.post(
            `${userType}/${userId}/others/peko-wallet`,
            payload
        );
        const { data } = resp;

        return data;
    } catch (err) {
        return false;
    }
};
