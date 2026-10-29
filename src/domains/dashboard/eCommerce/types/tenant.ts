export type TenantCustomDomain = {
    domain: string;
    verifiedAt: string | null;
} | null;

export type TenantPackagePrice = {
    monthly: string;
    annually: string;
    currency?: string;
};

export type TenantInfo = {
    id: string;
    status: string;
    subdomain: string | null;
    storeName: string | null;
    createdAt: string;
    isSetupCompleted: boolean;
    publishingEnabled: boolean;
    checkoutDisabled: boolean;
    fullStoreUrl: string | null;
    tenantAdminLoginUrl: string | null;
    customDomain: TenantCustomDomain;
};

export type TenantSubscription = {
    pekoSubscriptionId: string;
    status: string;
    billingCycle: 'monthly' | 'annually';
    currentPeriodStart: string;
    currentPeriodEnd: string;
    packageName: string;
    packagePrice: TenantPackagePrice;
    startedAt: string;
} | null;

export type TenantMoney = {
    amount: string;
    currency: string;
};

export type TenantOrders = {
    total: number;
    totalRevenue: TenantMoney;
    last30Days: { count: number; revenue: TenantMoney };
    thisMonth: { count: number; revenue: TenantMoney };
    previousMonth: { count: number; revenue: TenantMoney };
};

export type TenantProducts = {
    total: number;
    active: number;
    outOfStock: number;
};

export type TenantCustomers = {
    total: number;
};

export type TenantStatsResponse = {
    tenant: TenantInfo;
    subscription: TenantSubscription;
    orders: TenantOrders;
    products: TenantProducts;
    customers: TenantCustomers;
};

export type SetupTenantPayload = {
    storeName: string;
    email?: string;
    phone?: string;
    businessAddresses?: unknown[];
    primaryColor?: string;
    seoMetadata?: {
        metaTitle?: string;
        metaDescription?: string;
        ogImageUrl?: string;
    };
    taxRate?: number;
    taxInclusive?: boolean;
    taxEnabled?: boolean;
};
