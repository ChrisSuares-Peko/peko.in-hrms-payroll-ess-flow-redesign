export type UsePaymentApiProps = {
    setCheckoutJsInstance: React.Dispatch<React.SetStateAction<any>>;
    checkoutJsInstance: any;
};
export enum walletPaymentMode {
    card = 'CARD',
}
export type PaymentGeneric = {
    accessKey?: string;
    successUrl?: string;
    failureUrl?: string;
    amount?: number | string;
    total?: number;
    [key: string]: number | string | Object | undefined | null;
};
export type CommonFileBuffer = {
    pdfBuffer: any;
    buffer: any;
    fileType: string;
};
export type filterState = {
    type?: string;
    title?: string;
    searchText: string;
    category: string;
    sort: string;
    page: number;
    itemsPerPage: number;
    filter: string;
    from: string;
    to: string;
    sortField: string;
};
export type paymentResponse = {
    amount: number;
    corporateTxnId: number;
    datetime: string;
    corporateFinalBalance: any;
};
export interface userPayload {
    userType: string;
    userId: number;
}
export type TransactionDetailsPayload = {
    transactionId: string;
};
export type TransactionDetailsResponse = {
    id: number;
    corporateTxnId: string;
    operatorId: string;
    providerId: string;
    transactionDate: string;
    accountNo: string;
    amountInINR: string;
    baseAmount: string;
    paymentMode: string;
    orderResponse: string;
    paymentModeResponse: string;
    surcharge: string;
    baseCurrency: string;
    exchangeRate: string;
    status: string;
    message: string;
    ecomOrderStatus: string;
    workspaceOrderStatus: string;
    creditAmount?: string;
    transactionCategory?: string;
    shipmentStatus: any[];
    createdAt: string;
    updatedAt: string;
    serviceOperatorId: number;
    credentialId: number;
    serviceOperator: {
        serviceProvider: string;
        accessKey: string;
    };
};
export interface AddressFormValues {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email: string;
    flatNO: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
}
export type PaytmCreateOrderResponse = {
    amount: string;
    orderId: number;
    session_id: string;
};
export interface PaymentRequestPayload {
    amount: number;
    packageId: number;
    billingType: string;
    accessKey?: string;
    pgAmount?: number;
    successUrl: string;
    failureUrl: string;
    currentUrl: string;
    billingAddress?: AddressFormValues;
    couponCode?: string;
}

export interface Denominations {
    denomination: [];
}
