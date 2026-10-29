import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { dashboardStatusData, transactionResponse } from '../types/types';

export const getDashboardData = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<dashboardStatusData> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/ecommerce/dashboard/counters`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getOrdersDashboard = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<transactionResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/ecommerce/dashboard/orders`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
