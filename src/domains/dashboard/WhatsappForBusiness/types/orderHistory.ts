export interface Order {
    id: number;
    corporateTxnId: string;
    operatorId: string;
    providerId: string;
    transactionDate: string;
    accountNo: string | null;
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
    shipmentStatus: any[];
    createdAt: string;
    updatedAt: string;
    serviceOperatorId: number;
    credentialId: number;
}

export interface Pagination {
    currentPage: number;
    pageSize: number;
    totalPages: number;
    totalOrders: number;
}

export interface FetchOrdersResponse {
    orders: Order[];
    pagination: Pagination;
}

export enum PackageStatus {
    Active = 'ACTIVE',
    Expired = 'EXPIRED',
    Upgraded = 'UPGRADED',
    Due = 'DUE',
}

export enum PackageType {
    Individual = 'INDIVIDUAL',
    Group = 'GROUP',
}

export interface PackageQueryParams {
    page: number;
    itemsPerPage: number;
    status?: PackageStatus;
    packageType?: PackageType;
    searchText?: string;
}

export interface Package {
    id: number;
    packageName: string;
    packageType: 'INDIVIDUAL' | 'GROUP';
    description: string;
    serviceList: string;
    packageLogo: string;
}
export interface ActiveSubscription {
    id: number;
    subscriptionStartDate: string;
    subscriptionEndDate: string;
    billingType: string;
    subscriptionAmountPaid: string;
    status: 'ACTIVE' | 'EXPIRED' | 'UPGRADED' | 'DUE';
    package: Package;
    isTopMostPlan: boolean;
    subscriptionPaymentRefId: string | null;
    billingPlan?: string | null;
    isCustom?: boolean;
    isInvoice?: boolean;
}

type subscriptionWithCount = {
    rows: ActiveSubscription[];
    count: number;
};
export interface ResponseDataSubscriptionHistory {
    activeSubscriptions: subscriptionWithCount;
    currentGroupSubscription: ActiveSubscription;
}
