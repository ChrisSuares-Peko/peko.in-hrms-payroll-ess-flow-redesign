import { SortDirection } from '@customtypes/general';

import { RequestPayload } from '.';

export type filterState = {
    searchText: string;
    page: number;
    itemsPerPage: number;
    from: string;
    to: string;
};

export interface useOrderHistoryApiProps {
    sort: SortDirection;
    page: number;
    itemsPerPage: number;
    search?: string | null;
    from?: string;
    to?: string;
}

export interface TransactionsRequestPayload extends RequestPayload, useOrderHistoryApiProps {}

export interface OrderTableItem {
    amount: string;
    corporateTxnId: string;
    date: string;
    id: number;
    shipmentType: string;
    status: string;
    trackingNumber: string;
    paymentStatus: string;
}

export interface TransactionsResponse {
    totalData: number;
    result: OrderTableItem[];
}
