interface Credential {
    name: string;
    username: string;
}

export interface OrderItem {
    credential: Credential;
    order: {
        id: number;
        corporateTxnId: string;
        amountInINR: string;
        paymentMode: string;
        status: string;
        orderResponse: string; // JSON string, can be parsed when needed
        transactionDate: string;
        providerId: string;
    };
}

export interface esimReportResponse {
    result: OrderItem[];
    totalData: number;
}

export type EsimTable = {
    id: number;
    corporateTxnId: string;
    date: string;
    plan: string;
    amount: string;
    paymentType: string;
    customerName: string;
    quantity: number;
    retailPrice: number;
    netPrice: number;
    purchaseType: string;
};
