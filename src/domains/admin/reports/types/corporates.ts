export type ServiceOperator = {
    id: number;
    serviceProvider: string;
    serviceCategory: string;
};

export type Order = {
    id: number;
    amountInINR: string;
    paymentMode: string;
    status: string;
};

export type TransactionData = {
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
    serviceOperator: ServiceOperator;
    order: Order;
};

export type TransactionDataResponse = {
    result: TransactionData[];
    totalData: number;
};

export type AccountInfo = {
    name: string;
    id: number;
    credentialId: number;
    username: string;
    balance: string;
    registeredById: any;
};

export type AccountInfoData = {
    result: AccountInfo[];
};
