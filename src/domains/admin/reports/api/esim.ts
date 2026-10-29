import { CommonFileBuffer, SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { esimReportResponse } from '../types/esim';
import { getData } from '../types/index';

export const getEsimOrder = async (payload: UserPayload & getData) => {
    try {
        const resp: SuccessGenericResponse<esimReportResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/travel/eSIM/reports`,
            {
                params: {
                    sort: payload.sort,
                    page: payload.page,
                    searchText: payload.searchText,
                    itemsPerPage: payload.itemsPerPage,
                    to: payload.to,
                    from: payload.from,
                    sortField: payload.sortField,
                    partnerId: payload.partnerId,
                },
            }
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
            `${payload.userType}/${payload.userId}/travel/eSIM/reports/${payload.type}`,
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
