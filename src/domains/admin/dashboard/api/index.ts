import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { Data } from '../types/types';

export const getDashboardData = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<Data> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/dashboard/dashboardDetails`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
