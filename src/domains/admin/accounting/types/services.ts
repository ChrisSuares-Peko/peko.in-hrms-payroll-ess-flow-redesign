export type AccountingPlanType = 'with_plans' | 'without_plans';

export type CommissionMode = 'MARGIN' | 'AGENT_MARKUP' | 'PRINCIPAL_MARKUP';

export type CommissionType = 'PERCENTAGE' | 'FLAT';

export interface AccountingServiceVendor {
    id: number;
    vendorName: string;
    state: string | null;
    gstNo: string | null;
    address: string | null;
    vendorEmail: string[];
}

export interface ConfigurationCounts {
    total: number;
    notConfigured: number;
}

export interface ServiceConfiguration {
    plans: ConfigurationCounts | null;
    addOns?: ConfigurationCounts;
    serviceCommissionItems: string | null;
    platformFee: ConfigurationCounts;
}

export interface AccountingService {
    id: number;
    serviceProvider: string;
    accessKey: string;
    serviceCategory: string | null;
    serviceStatus: boolean;
    serviceImage: string | null;
    commissionMode: CommissionMode | null;
    commissionType: CommissionType | null;
    providerCommission: number;
    fixedCommissionPerTransaction: number;
    isCommissionInclGST: boolean | null;
    recordJournalEntry: boolean | null;
    createdAt: string;
    vendor: AccountingServiceVendor | null;
    planType: AccountingPlanType;
    commissionConfigured: boolean;
    configuration?: ServiceConfiguration | null;
}

export interface AccountingServiceFilters {
    searchText: string;
    page: number;
    itemsPerPage: number;
    sort: string;
    sortField: string;
}

export interface AccountingServiceListResponse {
    services: AccountingService[];
    recordsTotal: number;
    page: number;
    itemsPerPage: number;
}

export interface ServicesTypeConfig {
    service_with_plans: string[];
    service_without_plans: string[];
    peko_service_subscriptions?: string[];
    peko_subscription_vendors?: string[];
}

export interface CommissionBlock {
    commissionMode: CommissionMode;
    commissionType: CommissionType;
    commission: number;
    fixedCommissionPerTransaction: number;
    isCommissionInclGST: boolean;
}

export interface SplitCommission {
    monthly: CommissionBlock;
    annually: CommissionBlock;
}

export interface ServicePlan {
    id: number;
    planName: string;
    monthlyPrice?: number | string | null;
    minPrice?: number | string | null;
    maxPrice?: number | string | null;
    annualPrice?: number | string | null;
    planType?: string | null;
    productId?: string | null;
    partnerName?: string | null;
    workName?: string | null;
    variantName?: string | null;
    vendorPrice?: number | string | null;
    // What a markup commission adds on top of each stored price (0 when none), so the table can show
    // the price after commission with "Before commission" under it.
    priceMarkup?: { monthlyPrice?: number; annualPrice?: number; vendorPrice?: number } | null;
    monthlyDiscount?: number | string | null;
    annualDiscount?: number | string | null;
    displayName?: string | null;
    commissionMode: CommissionMode | null;
    commissionType: CommissionType | null;
    commission: number;
    fixedCommissionPerTransaction: number;
    isCommissionInclGST: boolean | null;
    // null means the monthly/annually split toggle is off; the flat fields above apply.
    splitCommission?: SplitCommission | null;
    commissionConfigured: boolean;
}

// An add-on (e.g. WhatsApp Bot Builder) is listed like a plan: planName is its name, monthlyPrice its amount.
export interface ServiceAddOn extends ServicePlan {
    addOnType: string;
}

export interface AccountingServiceCommissionModesResponse {
    accessKey: string;
    commissionModes: CommissionMode[];
}

export interface AccountingServiceAddOnsResponse {
    supported: boolean;
    addOns: ServiceAddOn[];
}

export interface AccountingServicePlansResponse {
    supported: boolean;
    plans: ServicePlan[];
    recordsTotal: number;
    page: number;
    itemsPerPage: number;
}

export interface AccountingServicePlansFilters {
    searchText: string;
    page: number;
    itemsPerPage: number;
    sort: string;
    sortField?: string;
    partnerId?: string;
}
