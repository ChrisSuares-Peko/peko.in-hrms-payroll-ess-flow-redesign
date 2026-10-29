import { SortDirection } from '@customtypes/general';

export interface OrderHistoryTablePayload {
    userType: string;
    userId: string | number;
    search?: string;
    start: number;
    length: number;
    from?: string;
    to?: string;
}

interface OrderHistoryItem {
    order: {
        id: number;
        amountInINR: string;
        paymentMode: string;
        status: string;
        orderResponse: string;
        transactionDate: string;
        corporateTxnId: string;
    };
}

export interface SelectedHike {
    id: number;
    hikeName: string;
    price: number;
    totalPrice: number;
    quantity: number;
    employees?: Array<{
        name: string;
        employeeId: string;
    }>;
}

export interface OrderHistoryListResponse {
    result: OrderHistoryItem[];
    totalData: number;
}

export type filterState = {
    searchText: string;
    page: number;
    itemsPerPage: number;
    from: string;
    to: string;
};

export interface useOrderHistoryApiProps {
    sort?: SortDirection;
    page: number;
    itemsPerPage: number;
    search?: string;
    from?: string;
    to?: string;
}
