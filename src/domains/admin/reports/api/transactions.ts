import dayjs from 'dayjs';

import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { getData } from '../types/index';
import { TransactionReportResp, TransactionsResp } from '../types/transactions';

export const getAllData = async (payload: UserPayload & getData) => {
    try {
        const resp: SuccessGenericResponse<TransactionsResp> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/transactions`,
            {
                params: {
                    sort: payload.sort,
                    page: payload.page,
                    searchText: payload.searchText,
                    itemsPerPage: payload.itemsPerPage,
                    to: payload.to,
                    from: payload.from,
                    corporateId: payload.id,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const getExcelReport = async (payload: UserPayload & getData) => {
    try {
        const resp: SuccessGenericResponse<TransactionReportResp> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/transactions/excel`,
            {
                params: {
                    sort: payload.sort,
                    page: payload.page,
                    searchText: payload.searchText,
                    itemsPerPage: payload.itemsPerPage,
                    from: dayjs(payload.from, 'YYYY-MM-DD').format('YYYY-MM-DD 00:00:00'),
                    to: dayjs(payload.to, 'YYYY-MM-DD').format('YYYY-MM-DD 23:59:59'),
                    corporateId: payload.id,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
