export type TransactionInfo = {
    id: number;
    transactionDate: string;
    corporateTxnId: string;
    transactionCategory: string;
    corporateCashback: string;
    totalCashback: string;
    systemCashback: string;
    balance: string;
    remarks: string;
    status: string;
    credentialId: number;
    creditAmount: string;
    debitAmount: string;
    transactionType: string;
    serviceOperator: {
        id: number;
        serviceProvider: string;
        serviceCategory: string;
    };
    credential: {
        name: string;
        email: string;
    };
    order: {
        id: number;
        amountInINR: string;
        paymentMode: string;
        status: string;
    };
};

export type TransactionsResp = {
    result: TransactionInfo[];
    totalData: number;
};
export type TransactionReportResp = {
    buffer: any;
    fileType: string;
};
