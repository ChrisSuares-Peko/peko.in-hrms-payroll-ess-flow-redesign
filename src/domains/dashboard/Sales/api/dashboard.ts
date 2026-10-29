import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { RecentTransactionsResponse, SalesDashboardData } from '../types/dashboard';

export const getSalesDashboard = async (payload: UserPayload) => {
    try {
        const { userId, userType } = payload;
        const resp: SuccessGenericResponse<SalesDashboardData> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/invoicing/v2/sales/dashboard`
        );
        return resp.status ? resp.data : null;
    } catch {
        return null;
    }
};

export const getRecentTransactions = async (
    payload: UserPayload & { page?: number; itemsPerPage?: number }
) => {
    try {
        const { userId, userType, page = 1, itemsPerPage = 6 } = payload;
        const resp: SuccessGenericResponse<RecentTransactionsResponse> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/invoicing/v2/sales/recent-transactions`,
            { params: { page, itemsPerPage } }
        );
        return resp.status ? resp.data : null;
    } catch {
        return null;
    }
};
