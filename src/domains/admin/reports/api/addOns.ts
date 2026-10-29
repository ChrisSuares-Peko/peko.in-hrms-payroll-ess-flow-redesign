import { CommonFileBuffer, SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { AddOnsPayload, AddOnsResponse } from '../types/addOns';

export const getAddOnData = async (payload: UserPayload & AddOnsPayload) => {
    try {
        const resp: SuccessGenericResponse<AddOnsResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/whatsapp-business/addOns`,
            {
                params: {
                    status: payload.category,
                    page: payload.page,
                    itemsPerPage: payload.pageSize,
                    searchText: payload.searchText,
                    sort: payload.sort,
                    sortField: payload.sortField,
                    from: payload.from,
                    to: payload.to,
                },
            }
        );

        const { data } = resp;

        return data;
    } catch (err) {
        return false;
    }
};

export const getFileBufferReport = async (payload: UserPayload & AddOnsPayload) => {
    try {
        const resp: SuccessGenericResponse<CommonFileBuffer> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/whatsapp-business/${payload.type}`,
            {
                params: {
                    sort: payload.sort,
                    searchText: payload.searchText,
                    to: payload.to,
                    from: payload.from,
                    status: payload.category,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
