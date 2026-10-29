export type refundTransationsRespone = {
    count: number;
    rows: Transaction[];
};
export type getData = {
    searchText: string;
    from?: string;
    to?: string;
    corporateId?: string | number;
    category?: string | number;
    itemsPerPage: number;
    page: number;
};
export type transactionData = {
    corporateTxnId: string;
    cryptoWalletAddress?: string;
    otp?: string;
    refundAmount: string;
    scope?: string;
    walletType?: string;
};
export type Transaction = {
    id: number;
    corporateTxnId: string;
    transactionId: string | null;
    transactionDate: string;
    transactionType: string;
    transactionCategory: string;
    debitAmount: string;
    creditAmount: string;
    refundedAmount: string;
    totalCashback: string;
    corporateCashback: string;
    systemCashback: string;
    balance: string;
    remarks: string;
    status: string;
    providerId: string;
    commissionDetails: CommissionDetails;
    createdAt: string;
    updatedAt: string;
    serviceOperatorId: number;
    credentialId: number;
    serviceOperator: ServiceOperator;
    credential: Credential;
    order: Order;
};

interface CommissionDetails {
    surcharge: number;
    cashbackType: string;
    corporateCashback: string;
    providerCommission: string;
    providerCommissionType: string;
}
interface ServiceOperator {
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
}

interface Order {
    id: number;
    corporateTxnId: string;
    operatorId: string;
    providerId: string;
    transactionDate: string;
    accountNo: string;
    amountInINR: string;
    baseAmount: string;
    paymentMode: string;
    orderResponse: string | null;
    paymentModeResponse: string | null;
    surcharge: string;
    baseCurrency: string;
    exchangeRate: string;
    status: string;
    message: string;
    ecomOrderStatus: string;
    workspaceOrderStatus: string;
    shipmentStatus: string[];
    createdAt: string;
    updatedAt: string;
    serviceOperatorId: number;
    credentialId: number;
}

export type RolePermissionAccessData = {
    view?: boolean;
    write?: boolean;
    update?: boolean;
};
