import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { DashboardDetails, PartnerChart } from '../types/types';

// import { Data } from '../types/types';

export const fetchDashboardData = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<DashboardDetails> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/partner/dashboardDetails`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const fetchChartData = async (payload: any) => {
    try {
        const resp: SuccessGenericResponse<PartnerChart> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/partner/dashboardStatistics?month=${payload.month}&year=${payload.year}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
