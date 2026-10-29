import { CommonFileBuffer, SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    ChangeStatusPayload,
    collectorKybListPayload,
    collectorKybListResponse,
} from '../types/collectorKyb';

export const getCollectorKybData = async (payload: UserPayload & collectorKybListPayload) => {
    try {
        const resp: SuccessGenericResponse<collectorKybListResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/collector-kyb/find-all`,
            {
                params: {
                    page: payload.page,
                    itemsPerPage: payload.pageSize,
                    searchText: payload.searchText,
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

export const getFileBufferReport = async (payload: UserPayload & collectorKybListPayload) => {
    try {
        const resp: SuccessGenericResponse<CommonFileBuffer> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/collector-kyb/${payload.type}`,
            {
                params: {
                    searchText: payload.searchText,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const updateStatus = async (payload: UserPayload & ChangeStatusPayload) => {
    try {
        const { userType, userId, corporateUserId, ...rest } = payload;
        const resp: SuccessGenericResponse<{}> = await ApiClient.put(
            `${userType}/${userId}/officeAndBusiness/collector-kyb/update-status/${corporateUserId}`,
            rest
        );

        const { data } = resp;

        return data;
    } catch (err) {
        return false;
    }
};
