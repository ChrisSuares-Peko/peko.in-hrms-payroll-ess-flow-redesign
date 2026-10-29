import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { AccountingDashboardData } from '../types/dashboard';

export const getAccountingDashboard = async (payload: UserPayload & { refresh?: boolean }) => {
    try {
        const { userId, userType, refresh } = payload;
        const resp: SuccessGenericResponse<AccountingDashboardData> = await ApiClient.get(
            `${userType}/${userId}/others/accounting/dashboard`,
            { params: refresh ? { refresh: 1 } : undefined }
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};
