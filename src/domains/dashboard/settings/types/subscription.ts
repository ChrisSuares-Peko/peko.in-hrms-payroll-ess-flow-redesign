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

export enum BillingTypes {
    Monthly = 'MONTHLY',
    Annually = 'ANNUALLY',
}

export interface Package {
    id: number;
    packageName: string;
    packageType: 'INDIVIDUAL' | 'GROUP';
    accessCode?: string;
    description: string;
    serviceList: string;
    packageLogo: string;
}

export interface ActiveSubscription {
    subscriptionPaymentRefId: any;
    id: number;
    subscriptionStartDate: string;
    subscriptionEndDate: string;
    billingType: string;
    subscriptionAmountPaid: string;
    status: 'ACTIVE' | 'EXPIRED' | 'UPGRADED' | 'DUE';
    package: Package;
    isCustom: boolean;
    isCancelled: boolean;
    isTopMostPlan: boolean;
    tableName: string;
    corporateTxnId?: string | number;
}

export type subscriptionWithCount = {
    rows: ActiveSubscription[];
    count: number;
};

export interface ResponseDataSubscriptionHistory {
    activeSubscriptions: subscriptionWithCount;
    currentGroupSubscription: ActiveSubscription;
}

export interface PackageQueryParams {
    page: number;
    itemsPerPage: number;
    status?: PackageStatus;
    packageType?: PackageType;
}

export type downloadResponse = {
    pdfBuffer: {
        type: string;
        data: [];
    };
};

export interface CurrentSubscription {
    billingType: string;
    status: string;
    subscriptionAmountPaid: string;
    package: {
        id: number;
        packageName: string;
        packageType: string;
    };
    isTopMostPlan: boolean;
    paymentMode: string | null;
}

export interface CurrentPlanResponse {
    currentSubscription: CurrentSubscription;
}
