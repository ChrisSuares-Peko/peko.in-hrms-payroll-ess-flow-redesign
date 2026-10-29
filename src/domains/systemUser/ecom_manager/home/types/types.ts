export interface dashboardStatusData {
    CANCELLED: number;
    COMPLETE: number;
    COMPLETED: number;
    CONFIRMED: number;
    DELIVERED: number;
    ONPROGRESS: number;
    PENDING: number;
    REFUNDED: number;
    SHIPPED: number;
    TOTAL: number;
    PRODUCTSCOUNT: number;
}

export type TransactionInfo = {
    id: number;
    transactionDate: string;
    providerId: string;
    corporateTxnId: string;
    transactionCategory: string;
    corporateCashback: string;
    orderResponse: string;
    serviceOperator: {
        serviceProvider: string;
    };
    order: {
        id: number;
        amountInINR: string;
        paymentMode: string;
        status: string;
    };
    credential: {
        name: string;
    };
};
export type transactionResponse = {
    recordsTotal: number;
    recordsFiltered: number;
    data: TransactionInfo[];
};
