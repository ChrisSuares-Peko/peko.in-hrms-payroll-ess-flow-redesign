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
    priorityLevel?: number;
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
    billingType: string;
};

export type RestaurantStatus = 'pending' | 'active' | 'suspended' | 'rejected';

export interface RestaurantPlan {
    id: string;
    name: string;
}

export interface RestaurantInfo {
    id: string;
    name: string;
    slug?: string;
    status: RestaurantStatus;
    isActive?: boolean;
    email?: string;
    phone?: string;
    // The vendor returns address and logo as plain strings, empty when unset.
    address?: Record<string, string> | string | null;
    logo?: string | null;
    brandColor?: string | null;
    plan?: RestaurantPlan | null;
    subscriptionExpiresAt?: string | null;
    createdAt?: string | null;
    isAwaitingApproval: boolean;
}

export interface PosSubscriptionInfo {
    id: number;
    packageName: string;
    subscriptionStartDate: string;
    subscriptionEndDate: string;
    subscriptionAmountPaid: number;
    billingType: string;
    status: string;
}

export interface PosDashboardResponse {
    isPurchased: boolean;
    restaurant: RestaurantInfo | null;
    subscription: PosSubscriptionInfo | null;
    ssoUrl: string | null;
    vendorError?: string | null;
}
