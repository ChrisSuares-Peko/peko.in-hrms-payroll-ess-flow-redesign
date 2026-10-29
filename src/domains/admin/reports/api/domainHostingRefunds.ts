import { CommonFileBuffer, SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { AllDomainHostingRefundsResponse } from '../types/domainHostingRefunds';
import { getData } from '../types/index';

export const getDomainHostingOrderDetails = async (payload: UserPayload & { corporateTxnId: string }) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/domain-and-hosting-orders/order/${payload.corporateTxnId}`
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const processDomainHostingRefund = async (payload: UserPayload & { corporateTxnId: string; refundAmount: number; remarks: string }) => {
    try {
        const { userId, userType, ...body } = payload;
        const resp: SuccessGenericResponse<object> = await ApiClient.post(
            `${userType}/${userId}/officeAndBusiness/domain-and-hosting-orders/refund`,
            body
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const getAllDomainHostingRefunds = async (payload: UserPayload & getData) => {
    try {
        const resp: SuccessGenericResponse<AllDomainHostingRefundsResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/reports/domain-hosting-refunds`,
            {
                params: {
                    sort: payload.sort,
                    page: payload.page,
                    searchText: payload.searchText,
                    itemsPerPage: payload.itemsPerPage,
                    from: payload.from,
                    to: payload.to,
                },
            }
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const getDomainHostingRefundsFileBuffer = async (payload: UserPayload & getData) => {
    try {
        const resp: SuccessGenericResponse<CommonFileBuffer> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/reports/domain-hosting-refunds/${payload.type}`,
            {
                params: {
                    sort: payload.sort,
                    searchText: payload.searchText,
                    from: payload.from,
                    to: payload.to,
                },
            }
        );
        return resp.data;
    } catch {
        return false;
    }
};
