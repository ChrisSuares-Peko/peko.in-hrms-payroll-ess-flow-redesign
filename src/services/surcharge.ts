import { SuccessGenericResponse, SurchargeResponse, UserPayload } from '@customtypes/general';

import { ApiClient } from './config';

export const getSurcharge = async (
    payload: UserPayload & { amount: number; accessKey: string; quantity?: number; billerId?: string }
) => {
    try {
        const params: Record<string, any> = { accessKey: payload.accessKey, amount: payload.amount };
        if (payload.billerId) params.billerId = payload.billerId;
        if (payload.quantity) params.quantity = payload.quantity;
        const resp: SuccessGenericResponse<SurchargeResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payment-gateway/surcharge`,
            { params }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
