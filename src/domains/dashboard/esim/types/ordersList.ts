export type OrdersListPayload = {
    userId: number;
    userType: string;
    page: number;
    itemsPerPage: number;
    searchText: string;
    fromDate: string;
    toDate: string;
};


interface DataItem {
    createdAt: string;
    transactionCategory: string;
    corporateTxnId: number;
    orderId: number;
    status: string;
    amountInINR: number;
    paymentMode: string;
    simDetailsEsim: string;
    simDetailsPlanId: string | null;
    customerUid: string;
    country: string;
    planName: string | null;
    activationMode: string | null;
    activatedAt: string | null;
    expiresAt: string | null;
    dataSize: string | null;
    validity: string | null;
    installationUrl: string | null;
    purchasedForName: string | null;
}

interface TopUpDetailItem {
    createdAt: string;
    transactionCategory: string;
    orderId: string;
    amountInINR: string;
    paymentMode: string;
    eSIM: string | null;
    planCreatedAt: string;
    metadata: string | null;
    planId: string;
    type: string;
    validity: string | null;
    data: string | null;
}

export interface ordersList {
    data: DataItem[];
    recordsTotal: number;
}

export interface topUpHistoryList {
    data: TopUpDetailItem[];
    recordsTotal: number;
}
