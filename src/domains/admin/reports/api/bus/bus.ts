import { CommonFileBuffer, SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { getData } from '../../types';

export const getAllData = async (payload: getData & UserPayload) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/travel/bus/list-cancelled-booking`,
            {
                params: {
                    page: payload.page,
                    limit: payload.itemsPerPage,
                    searchText: payload.searchText,
                    from: payload.from,
                    to: payload.to,
                    credentialId: payload.id,
                    partnerId: payload.partnerId,
                    sort: payload.sort,
                    sortField: payload.sortField,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getFileBufferReport = async (payload: getData & UserPayload & { type: string }) => {
    try {
        const resp: SuccessGenericResponse<CommonFileBuffer> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/travel/bus/list-cancelled-booking/${payload.type}`,
            {
                params: {
                    sort: payload.sort,
                    searchText: payload.searchText,
                    to: payload.to,
                    from: payload.from,
                    credentialId: payload.id,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const refundApi = async (payload: UserPayload & { corporateTxnId: string; refundAmount: number }) => {
    try {
        const { userType, userId, ...rest } = payload;
        const resp: SuccessGenericResponse<any> = await ApiClient.post(
            `${userType}/${userId}/travel/bus/refund-cancelled-booking`,
            { ...rest }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
