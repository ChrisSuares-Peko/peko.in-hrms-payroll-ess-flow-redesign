export type reportListingPayload = {
    userId: number;
    userType: string;
    from: string;
    to: string;
    categoryName: string;
    accessKey?: string;
    searchText: string;
    sort: string;
    page: number;
    itemsPerPage: number;
    filter: string;
    sortField: string;
};

export type downloadInvoicePayload = {
    userId: number;
    userType: string;
    transactionID: number;
    type: 'invoice' | 'receipt';
};
type ServiceOperator = {
    id: number;
    serviceProvider: string;
};

type Order = {
    id: number;
    amountInINR: number;
    paymentMode: string;
    paymentInstrument?: string | null;
    status: string;
    accountNo: string;
    orderResponse: string | null;
    subCorporateUser: {
        id: number;
        name: string;
    };
};

type ReportBody = {
    id: number;
    transactionDate: string;
    corporateTxnId: number;
    transactionCategory: string;
    serviceOperator: ServiceOperator;
    order: Order;
    corporateCashback: string;
    isInvoice?: boolean;
};

export type ShedulerResponse = {
    name: string;
    email: string;
    dailyReport: {
        email: string[];
        isActive: boolean;
        scheduledTime: string;
        scheduledDay?: string;
    };
    weeklyReport: {
        email: string[];
        isActive: boolean;
        scheduledTime: string;
        scheduledDay: string;
    };
    monthlyReport: {
        email: string[];
        isActive: boolean;
        scheduledTime: string;
        scheduledDay?: string;
    };
};

export type reportListingResponse = {
    result: ReportBody[];
    totalData: number;
};

export type ReportRow = {
    date: string;
    transactionID: number;
    category: string;
    operator: string;
    amount: number;
    paymentMode: string;
    status: string;
    download: string;
    cashback: string;
};
export type useFilterCommon = {
    searchText: string;
    page: number;
    itemsPerPage: number;
    partnerId?: string | number;
    sort?: 'ASC' | 'DESC';
    sortField?: string;
    from?: string;
    to?: string;
    corporateId?: string | number;
    category?: string | number;
};
export type transactionType = {
    date: string;
    transactionID: number;
    category: string;
    operator: string;
    amount: any;
    paymentMode: string;
    status: string;
    download: string;
    cashback: string;
    accountNumber: string;
    subCorporateName: string;
    isInvoice?: boolean;
};

export interface filterOption {
    value: string;
    label: string;
}

export interface categoryListingResponse {
    category: filterOption[];
}
export interface invoiceResponse {
    id: number;
    corporateTxnId: string;
    operatorId: string;
    providerId: null | number;
    transactionDate: string;
    accountNo: string;
    amountInINR: string;
    baseAmount: string;
    paymentMode: string;
    orderResponse: null;
    paymentModeResponse: null;
    surcharge: string;
    baseCurrency: string;
    exchangeRate: string;
    status: string;
    message: string;
    ecomOrderStatus: null;
    workspaceOrderStatus: string;
    shipmentStatus: null;
    createdAt: string;
    updatedAt: string;
    serviceOperatorId: number;
    credentialId: number;
    serviceOperator: {
        serviceProvider: string;
    };
}
export type ShedulerPayload = {
    userId: number;
    userType: string;
};

export type updateShedulerPayload = shedulerTypes & {
    userId: number;
    userType: string;
    route: string;
};
export type updateShedulerResponse = {
    data: {};
    success: boolean;
};

export type shedulerTypes = {
    email: string[] | undefined | false;
    isActive: boolean | undefined;
    scheduledTime: string | false | undefined;
    scheduledDay: string | false | undefined;
};

export type HandleUpdateBtnType = (
    title: string,
    emailIds: string[] | false | undefined,
    scheduledTime: string | false | undefined,
    scheduledDay: string | false | undefined,
    isActive: boolean | undefined,
    isToggle?: boolean
) => void;

export type AllShedulerTypes = {
    title: string;
    email: string[] | undefined | false | any;
    isActive: boolean | undefined;
    scheduledTime: string | false | undefined;
    scheduledDay: string | false | undefined;
    handleUpdateBtn: HandleUpdateBtnType;
};

export type filterState = {
    type?: string;
    title?: string;
    searchText: string;
    category: string;
    accessKey?: string;
    sort: string;
    page: number;
    itemsPerPage: number;
    filter: string;
    from: string;
    to: string;
    sortField: string;
};
export type getData = {
    page: number;
    searchText: string;
    itemsPerPage: number;
    sort: string;
    sortField?: string;
    from?: string;
    to?: string;
    id?: string | number;
    category?: any;
    type?: string;
};
export type downloadResponse = {
    pdfBuffer: {
        type: string;
        data: [];
    };
    // What the invoice is called: the platform fee invoice, or the plan invoice when that is the only one.
    label?: string;
    // On-behalf-of-vendor invoice(s), e.g. Plan-Tax-Invoice — present alongside the
    // platform-fee invoice only for Agent/Principal Markup orders.
    additionalInvoices?: Array<{
        label: string;
        pdfBuffer: {
            type: string;
            data: [];
        };
    }>;
};

export type transactionResponse = {
    rows: transactionType[];
    count: number;
};

export interface subscriptionListingResponse {
    subscription: filterOption[];
}

export type subscriptionTransactionRow = {
    date: string;
    transactionID: number;
    amount: string;
    paymentMode: string;
    status: string;
    download: string;
    cashback: string;
    accountNumber: string;
    subCorporateName: string;
    serviceName: string;
    billingType: string;
    isInvoice?: boolean;
};

export type subscriptionReportListingResponse = {
    result: SubscriptionReportBody[];
    totalData: number;
};

type SubscriptionReportBody = {
    id: number;
    transactionDate: string;
    corporateTxnId: number;
    transactionCategory: string;
    serviceOperator: ServiceOperator;
    amountInINR: string;
    baseAmount: string;
    corporateCashback: string;
    subCorporateUser: SubCorporateUser | null;
    paymentMode: string;
    paymentInstrument?: string | null;
    status: string;
    download: string;
    orderResponse: string;
    optional: string;
    isInvoice?: boolean;
};

type SubCorporateUser = {
    name: string | null;
};
