export type TransactionInfo = {
    id: number;
    corporateTxnId: string;
    transactionId: string | null;
    transactionDate: string;
    transactionType: string;
    transactionCategory: string;
    debitAmount: string;
    creditAmount: string;
    totalCashback: string;
    corporateCashback: string;
    systemCashback: string;
    balance: string;
    remarks: string;
    status: string;
    providerId: string;
    commissionDetails: {
        surcharge: string;
        cashbackType: string;
        corporateCashback: string;
        providerCommission: string;
        providerCommissionType: string;
    };
    createdAt: string;
    updatedAt: string;
    serviceOperatorId: number;
    credentialId: number;
    orderId: number;
    serviceOperator: {
        id: number;
        serviceProvider: string;
        accessKey: string;
        serviceStatus: number;
        providerCommission: string;
        serviceImage: string;
        serviceCategory: string;
        remarks: string | null;
        countryName: string;
        countryCode: number;
        balanceMethod: number;
        commissionType: string;
        serviceType: string;
        isPlanAvailable: number;
        createdAt: string;
        updatedAt: string;
        vendorId: number;
    };
    credential: {
        id: number;
        role: string;
        username: string;
        name: string;
        email: string;
        password: string;
        passwordResetToken: string;
        passwordResetExpires: string;
        registeredBy: string | null;
        lastLogin: string | null;
        createdAt: string;
        updatedAt: string;
    };
    order: {
        id: number;
        corporateTxnId: string;
        operatorId: string;
        providerId: string;
        transactionDate: string;
        accountNo: string | null;
        amountInINR: string;
        baseAmount: string;
        paymentMode: string;
        orderResponse: string;
        paymentModeResponse: string | null;
        surcharge: string;
        baseCurrency: string;
        exchangeRate: string;
        status: string;
        message: string;
        ecomOrderStatus: string;
        workspaceOrderStatus: string;
        shipmentStatus: any[]; // You might want to replace `any[]` with a more specific type if available
        createdAt: string;
        updatedAt: string;
        serviceOperatorId: number;
        credentialId: number;
    };
};

export type transactionResponse = {
    recordsTotal: number;
    data: TransactionInfo[];
};
export type VendorInfo = {
    id: number;
    vendorName: string;
};
export type VendorInfoData = {
    data: VendorInfo[];
};
