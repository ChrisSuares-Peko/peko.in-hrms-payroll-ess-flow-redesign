import { SortDirection } from '@customtypes/general';

import { RequestPayload } from './index';

export interface useOrderHistoryApiProps {
    sort: SortDirection;
    page: number;
    itemsPerPage: number;
    search?: string | null;
    from?: string;
    to?: string;
}
export interface TransactionsRequestPayload extends RequestPayload, useOrderHistoryApiProps {}

interface Order {
    order: {
        id: number;
        status: string;
        orderResponse: string;
        transactionDate: string;
        corporateTxnId: string;
        shipmentStatus: any[]; // You can define a proper type for this if needed
        providerId: string;
    };
}

export interface TransactionsResponse {
    totalData: number;
    result: Order[];
}

export interface OrderTableItem {
    id: number;
    date: string;
    serviceType: string;
    transactionId: string;
    amount: string;
    status: string;
    providerId: string;
}
