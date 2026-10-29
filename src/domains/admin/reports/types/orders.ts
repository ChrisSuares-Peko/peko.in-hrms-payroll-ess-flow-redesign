import { DropDown } from '@customtypes/general';

export type TransactionInfo = {
    id: number;
    transactionDate: string;
    corporateTxnId: string;
    transactionCategory: string;
    corporateCashback: string;
    serviceOperator: {
        id: number;
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
        email: string;
    };
};
export type transactionResponse = {
    totalData: number;
    result: TransactionInfo[];
};
export type categoryResponse = {
    category: DropDown;
};

export type TransactionDiagnosticDetails = {
    transaction: {
        id: number;
        corporateTxnId: string;
        transactionId: string | null;
        transactionDate: string;
        transactionType: string;
        transactionCategory: string;
        status: string;
        remarks: string | null;
        debitAmount: string;
        creditAmount: string;
        providerId: string | null;
        createdAt: string;
    };
    failure: {
        status: string;
        message: string | null;
        errorCode: string | null;
        errorMessage: string | null;
        providerName: string | null;
        paymentMode: string | null;
        rawResponse: Record<string, unknown> | null;
    };
    order: {
        id: number;
        corporateTxnId: string;
        amountInINR: string;
        paymentMode: string;
        accountNo: string;
        status: string;
        message: string | null;
        paymentModeResponse: Record<string, unknown> | null;
        createdAt: string;
    };
    serviceOperator: {
        id: number;
        serviceProvider: string;
        serviceCategory: string;
    };
    credential: {
        name: string;
        email: string;
    };
    refund: {
        isRefunded: boolean;
        refundTransactionId: number | null;
        refundAmount: number | null;
        cashbackReversed: number | null;
        refundDate: string | null;
    };
};
