import { CommonFileBuffer, SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { getData } from '../types/index';
import { subscriptionResponse } from '../types/pekoSubscription';

export const getAllData = async (payload: UserPayload & getData) => {
    try {
        const resp: SuccessGenericResponse<subscriptionResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/users/subscriptions`,
            {
                params: {
                    status: payload.category,
                    packageType: '',
                    page: payload.page,
                    searchText: payload.searchText,
                    itemsPerPage: payload.itemsPerPage,
                    corporateId: payload.id,
                    to: payload.to,
                    from: payload.from,
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

export const getFileBufferReport = async (payload: UserPayload & getData) => {
    try {
        const resp: SuccessGenericResponse<CommonFileBuffer> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/users/subscriptions/${payload.type}`,
            {
                params: {
                    status: payload.category,
                    packageType: '',
                    searchText: payload.searchText,
                    corporateId: payload.id,
                    to: payload.to,
                    from: payload.from,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
