import { SuccessGenericResponse } from '@customtypes/api';
import { ApiClient } from '@src/services/config';

import {
    CreateRequestResponse,
    RequestFormValues,
    BasicInfoResponse,
    UserPayload,
    OrderHistoryTablePayload,
    OrderHistoryListResponse,
} from '../types/index';

export const getBasicInfo = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<BasicInfoResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/profile/basic`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const createRequest = async (payload: UserPayload & RequestFormValues) => {
    try {
        const resp: SuccessGenericResponse<CreateRequestResponse> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/officeAndBusiness/paytmBpos`,
            payload
        );
        const { data } = resp;
        return data.result;
    } catch (err) {
        return false;
    }
};

export const getOrderHistoryTable = async (payload: OrderHistoryTablePayload) => {
    try {
        const resp: SuccessGenericResponse<OrderHistoryListResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/paytmBpos/history?sort=DESC`,
            {
                params: {
                    searchText: payload.search,
                    page: payload.start,
                    itemsPerPage: payload.length,
                },
            }
        );
        const { data } = resp;

        return data;
    } catch (err) {
        return false;
    }
};
