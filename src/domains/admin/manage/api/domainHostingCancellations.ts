import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    CancellationRequestsData,
    GetCancellationRequestsParams,
    ProcessRefundPayload,
} from '../types/domainHostingCancellations';

const BASE = (userType: string, userId: string | number) =>
    `${userType}/${userId}/officeAndBusiness/domain-and-hosting-orders`;

export const getCancellationRequests = async (
    payload: UserPayload & GetCancellationRequestsParams
) => {
    try {
        const resp: SuccessGenericResponse<CancellationRequestsData> = await ApiClient.get(
            `${BASE(payload.userType, payload.userId)}/cancellation-requests`,
            {
                params: {
                    limit: payload.limit,
                    page: payload.page,
                    from: payload.from,
                    to: payload.to,
                    searchText: payload.searchText,
                    sort: payload.sort,
                },
            }
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const processRefundApi = async (payload: UserPayload & ProcessRefundPayload) => {
    try {
        const resp: SuccessGenericResponse<Record<string, never>> = await ApiClient.post(
            `${BASE(payload.userType, payload.userId)}/refund`,
            {
                corporateTxnId: payload.corporateTxnId,
                refundAmount: payload.refundAmount,
                remarks: payload.remarks,
            }
        );
        return resp;
    } catch {
        return false;
    }
};
