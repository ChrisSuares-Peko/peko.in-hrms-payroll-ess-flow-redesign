import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    CorporateCardTransactionDetail,
    CorporateCardTransactionFilters,
    CorporateCardTransactionListResponse,
    TransactedCorporateOption,
} from '../types/corporateCardTransactions';

const base = (userType: string, userId: number) =>
    `${userType}/${userId}/corporate-cards/transactions`;

export const getCorporateCardTransactions = async (
    payload: UserPayload & CorporateCardTransactionFilters
) => {
    try {
        const resp: SuccessGenericResponse<CorporateCardTransactionListResponse> =
            await ApiClient.get(base(payload.userType, payload.userId), {
                params: {
                    page: payload.page,
                    itemsPerPage: payload.itemsPerPage,
                    ...(payload.corporateId ? { corporateId: payload.corporateId } : {}),
                    ...(payload.cardLast4 ? { cardLast4: payload.cardLast4 } : {}),
                    ...(payload.decision ? { decision: payload.decision } : {}),
                    ...(payload.internalStatus ? { internalStatus: payload.internalStatus } : {}),
                    ...(payload.transactionType !== undefined
                        ? { transactionType: payload.transactionType }
                        : {}),
                    ...(payload.category ? { category: payload.category } : {}),
                    ...(payload.dateFrom ? { dateFrom: payload.dateFrom } : {}),
                    ...(payload.dateTo ? { dateTo: payload.dateTo } : {}),
                    ...(payload.searchText ? { searchText: payload.searchText } : {}),
                },
            });
        return resp.data;
    } catch {
        return false;
    }
};

export const getCorporateCardTransaction = async (userType: string, userId: number, id: number) => {
    try {
        const resp: SuccessGenericResponse<{ transaction: CorporateCardTransactionDetail }> =
            await ApiClient.get(`${base(userType, userId)}/${id}`);
        return resp.data.transaction;
    } catch {
        return false;
    }
};

export const getTransactedCorporates = async (userType: string, userId: number) => {
    try {
        const resp: SuccessGenericResponse<{ corporates: TransactedCorporateOption[] }> =
            await ApiClient.get(`${base(userType, userId)}/corporates`);
        return resp.data.corporates;
    } catch {
        return false;
    }
};
