import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { OrderDocumentAvailability } from '@src/domains/admin/reports/types/orderJournal';
import { ApiClient } from '@src/services/config';

import { ExportFormat } from '../types/export';
import { Posting } from '../types/posting';
import { AccountScope } from '../utils/accountScope';

export type BillingType = 'MONTHLY' | 'ANNUALLY';

export type SubscriptionDetailsQuery = {
    page: number;
    itemsPerPage: number;
    searchText?: string;
    from?: string;
    to?: string;
    // 'default' is the dropdown's sentinel for "no referring partner", not a real id.
    partnerId?: number | string;
    billingType?: BillingType;
    accounts?: AccountScope;
};

export type SubscriptionDetailsExportQuery = Omit<
    SubscriptionDetailsQuery,
    'page' | 'itemsPerPage'
> & {
    format: ExportFormat;
};

export type SubscriptionDetailsRow = {
    id: number;
    corporateTxnId: string;
    transactionDate: string;
    subscriberUsername: string | null;
    subscriberName: string | null;
    partnerName: string | null;
    plan: string | null;
    billingType: BillingType | null;
    orderValue: number | null;
    netRevenue: number | null;
    posting: Posting;
    documents: OrderDocumentAvailability;
};

export type SubscriptionDetailsResponse = {
    result: SubscriptionDetailsRow[];
    totalData: number;
};

export const getSubscriptionDetails = async (payload: UserPayload & SubscriptionDetailsQuery) => {
    try {
        const resp: SuccessGenericResponse<SubscriptionDetailsResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/order-journals/subscription-details`,
            {
                params: {
                    page: payload.page,
                    itemsPerPage: payload.itemsPerPage,
                    searchText: payload.searchText,
                    from: payload.from,
                    to: payload.to,
                    partnerId: payload.partnerId,
                    billingType: payload.billingType,
                    accounts: payload.accounts,
                },
            }
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const downloadSubscriptionDetails = async (
    payload: UserPayload & SubscriptionDetailsExportQuery
) => {
    try {
        const resp = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/order-journals/subscription-details/export/${payload.format}`,
            {
                params: {
                    searchText: payload.searchText,
                    from: payload.from,
                    to: payload.to,
                    partnerId: payload.partnerId,
                    billingType: payload.billingType,
                    accounts: payload.accounts,
                },
                responseType: 'blob',
            }
        );
        return resp as unknown as Blob;
    } catch (err) {
        return false;
    }
};
