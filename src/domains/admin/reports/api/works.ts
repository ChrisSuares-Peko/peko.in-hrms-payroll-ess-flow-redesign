import { CommonFileBuffer, SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { OrderUpdatePayload, getData } from '../types/index';
import { transactionResponse, updateResponse } from '../types/works';

export const getAllData = async (payload: UserPayload & getData) => {
    try {
        const resp: SuccessGenericResponse<transactionResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/worksReport`,
            {
                params: {
                    from: payload.from,
                    to: payload.to,
                    sort: payload.sort,
                    page: payload.page,
                    itemsPerPage: payload.itemsPerPage,
                    searchText: payload.searchText,
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

export const updateOrderApi = async ({
    userId,
    userType,
    id,
    ...payload
}: UserPayload & OrderUpdatePayload) => {
    try {
        const resp: SuccessGenericResponse<updateResponse> = await ApiClient.patch(
            `${userType}/${userId}/officeAndBusiness/worksReport/${id}`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getFileBufferReport = async (payload: UserPayload & getData) => {
    try {
        const resp: SuccessGenericResponse<CommonFileBuffer> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/worksReport/${payload.type}`,
            {
                params: {
                    sort: payload.sort,
                    searchText: payload.searchText,
                    to: payload.to,
                    from: payload.from,
                    vendorId: payload.id,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
