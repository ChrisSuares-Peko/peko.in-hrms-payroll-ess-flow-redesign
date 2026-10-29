import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { AccountingGoLiveDate, AccountingGoLiveDatePayload } from '../types/accountingPeriod';

export const getAccountingGoLiveDate = async (payload: UserPayload) => {
    try {
        const { userId, userType } = payload;
        const resp: SuccessGenericResponse<AccountingGoLiveDate> = await ApiClient.get(
            `${userType}/${userId}/others/accounting/go-live-date`
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const updateAccountingGoLiveDate = async (
    payload: UserPayload & AccountingGoLiveDatePayload
) => {
    try {
        const { userId, userType, ...body } = payload;
        const resp: SuccessGenericResponse<AccountingGoLiveDate> = await ApiClient.put(
            `${userType}/${userId}/others/accounting/go-live-date`,
            body
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};
