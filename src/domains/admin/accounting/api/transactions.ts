import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { AccountScope } from '../utils/accountScope';

export type TransactionsQuery = {
    page: number;
    itemsPerPage: number;
    searchText?: string;
    sort?: string;
    sortField?: string;
    from?: string;
    to?: string;
    status?: string;
    accounts?: AccountScope;
};

export type TransactionsTotals = {
    count: number;
    totalAmount: number;
    totalDiscount: number;
    totalNetGmv: number;
};

export type TransactionsResponse = {
    result: any[];
    totalData: number;
    totals: TransactionsTotals;
};

export const getTransactions = async (payload: UserPayload & TransactionsQuery) => {
    try {
        const resp: SuccessGenericResponse<TransactionsResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/order-journals/transactions`,
            {
                params: {
                    page: payload.page,
                    itemsPerPage: payload.itemsPerPage,
                    searchText: payload.searchText,
                    sort: payload.sort,
                    sortField: payload.sortField,
                    from: payload.from,
                    to: payload.to,
                    status: payload.status,
                    accounts: payload.accounts,
                },
            }
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};
