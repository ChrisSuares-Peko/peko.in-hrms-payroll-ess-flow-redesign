import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    MswipeRefundFilters,
    MswipeRefundsResponse,
    UpdateMswipeRefundPayload,
} from '../types/mswipeRefunds';

export const getMswipeRefunds = async ({
    userId,
    userType,
    ...filters
}: UserPayload & MswipeRefundFilters) => {
    try {
        const resp: SuccessGenericResponse<MswipeRefundsResponse> = await ApiClient.get(
            `${userType}/${userId}/payment-gateway/manual-refunds`,
            { params: filters }
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const updateMswipeRefundStatus = async ({
    userId,
    userType,
    id,
    ...body
}: UserPayload & UpdateMswipeRefundPayload) => {
    try {
        const resp: SuccessGenericResponse<Record<string, never>> = await ApiClient.put(
            `${userType}/${userId}/payment-gateway/manual-refunds/${id}`,
            body
        );
        return Boolean(resp?.status);
    } catch {
        return false;
    }
};
