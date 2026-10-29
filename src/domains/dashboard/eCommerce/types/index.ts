export interface CommonPayload {
    userId: number;
    userType: string;
}

export interface SubscriptionApiPayload extends CommonPayload {
    accessKey: string;
}

export interface PackagePrice {
    monthly: string;
    annually: string;
}

export interface Discount {
    monthly: number;
    annually: number;
}

export interface PackageDetails {
    id: number;
    packageName: string;
    packagePrices: PackagePrice;
    description: string;
    discount?: Discount;
}

export interface SubscriptionDetailsResponse {
    packageDetails: PackageDetails[];
}

export type isPurchasedResponse = {
    id: number;
    isPurchased: boolean;
    status: string;
    subscriptionEndDate: string;
    subscriptionStartDate: string;
    package?: {
        packageName: string;
    };
    subscriptionAmountPaid: number;
    upgradeCredit: number;
    billingType: string;
    isCancelled: boolean;
    previousSubscription: null | {
        packageId: string;
        packageName: string;
        subscriptionEndDate: string;
        billingType: string;
        status: string;
    };
};

export enum PlanType {
    Monthly = 'monthly',
    Annually = 'annually',
}

export type cancelBillingPayload = {
    userId: number;
    userType: string;
    subscriptionId: number;
};
