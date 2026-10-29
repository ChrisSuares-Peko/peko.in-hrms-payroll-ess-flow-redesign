import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { PayrollAccountStatus } from '../../types/payrollAccount';

export const getPayrollAccountStatusApi = async (payload: UserPayload) => {
    try {
        const { userId, userType } = payload;
        const resp: SuccessGenericResponse<PayrollAccountStatus> = await ApiClient.get(
            `${userType}/${userId}/payroll/account/status`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
