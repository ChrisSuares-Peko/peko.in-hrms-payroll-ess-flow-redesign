import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { getData, DemoRequestsDataResponse } from '../types/types';

export const getAllData = async (payload: UserPayload & getData) => {
    try {
        const resp: SuccessGenericResponse<DemoRequestsDataResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/paytmBpos`,
            {
                params: {
                    from: payload.from,
                    to: payload.to,
                    sort: payload.sort,
                    page: payload.page,
                    itemsPerPage: payload.itemsPerPage,
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

export const updateStatus = async (payload: UserPayload & { itemId: number; status: string }) => {
    try {
        const { userType, userId, itemId, status } = payload;

        const resp: SuccessGenericResponse<DemoRequestsDataResponse> = await ApiClient.post(
            `${userType}/${userId}/officeAndBusiness/paytmBpos/update-status/${itemId}`,
            { status }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
