import { Packages } from '@src/domains/admin/settings/types/package';

export type GatewayChargeTerms = {
    percentage: number | string | null;
    fixed: number | string | null;
};

export type WhitelabelPartnerRow = {
    id: number;
    registeredBy: string | number;
    sharePercentage: string | number | null;
    gatewayCharge?: GatewayChargeTerms | null;
    brandingStatus: boolean | number;
    assets?: { baseUrl?: string } | null;
    credential?: { id: number; name: string } | null;
    createdAt: string;
};

export type SubscriptionPackage = Packages & { serviceName?: string | null };

export type SubscriptionPackagesResponse = {
    recordsTotal: number;
    recordsFiltered: number;
    data: SubscriptionPackage[];
};

export type SubscriptionPricing = {
    packagePrices: { monthly: number; annually: number };
    discount: { monthly: number; annually: number };
};
