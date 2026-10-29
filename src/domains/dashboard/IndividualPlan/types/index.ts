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
    discount: Discount;
}

export interface SubscriptionDetailsResponse {
    packageDetails: PackageDetails[];
    isPurchased: boolean;
    // Gating for the per-service "upgrade to individual package" CTA:
    //   isPaidGroupUser    — user is on an active paid GROUP plan (Peko Go/Plus) → hide CTA.
    //   ownsIndividualPackage — user already owns THIS service's individual package → hide CTA.
    isPaidGroupUser?: boolean;
    ownsIndividualPackage?: boolean;
    previousSubscription: PreviousSubscription;
    paidPlanExpiredRecently?: PaidPlanExpiredRecently | null;
    lifecycle?: LifecycleInfo;
    showSubscriptionLanding?: boolean;
    subscriptionLandingKey?: string | null;
}

export type LifecycleState = 'ACTIVE' | 'GRACE' | 'FROZEN' | 'CLEAR_ELIGIBLE' | 'NONE';

export interface LifecycleInfo {
    state: LifecycleState;
    gracePeriodDays: number;
    frozenPeriodDays: number;
    payrollDataClearDays: number;
}

export interface PreviousSubscription {
    billingType: 'MONTHLY' | 'ANNUALLY';
    status: 'EXPIRED';
    packageId: number;
    packageName: string;
    packageType?: string;
    subscriptionId?: number;
    paymentMode?: 'PAYMENT GATEWAY' | 'ACTIVATION_CODE';
    willAutoRenew?: boolean;
}

export interface PaidPlanExpiredRecently {
    subscriptionId: number;
    packageName: string;
    packageType: 'GROUP' | 'INDIVIDUAL';
    subscriptionEndDate: string;
    billingType: 'MONTHLY' | 'ANNUALLY';
    paymentMode?: 'PAYMENT GATEWAY' | 'ACTIVATION_CODE';
    willAutoRenew?: boolean;
}

export interface ISubscriptionDetailsPayload {
    accessKey?: string;
    packageName?: string;
}

export interface featureType {
    icon: string;
    title: string;
    description: string;
}
