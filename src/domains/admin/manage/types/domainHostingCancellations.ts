export interface DomainHostingCancellationOrderResponse {
    items?: unknown[];
    cancelledAt?: string;
    cancelledItemType?: string;
    refundAmount?: number;
    adminRemarks?: string;
    refundedAt?: string;
}

export interface DomainHostingCancellation {
    id: number;
    corporateTxnId: string;
    transactionDate: string;
    amountInINR: number;
    status: string;
    paymentMode: string;
    message?: string;
    orderResponse?: DomainHostingCancellationOrderResponse;
    credential: {
        id: number;
        username: string;
        name: string;
    };
    serviceOperator: {
        id: number;
        serviceProvider: string;
    };
}

export interface GetCancellationRequestsParams {
    limit?: number;
    page?: number;
    from?: string;
    to?: string;
    searchText?: string;
    sort?: 'ASC' | 'DESC';
}

export interface CancellationRequestsData {
    data: DomainHostingCancellation[];
    count: number;
    totalPages: number;
}

export interface ProcessRefundPayload {
    corporateTxnId: string;
    refundAmount: number;
    remarks: string;
}
