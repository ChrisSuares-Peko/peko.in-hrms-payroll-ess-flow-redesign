export const THIRD_PARTY_CONFIGURATION_TABS = { paymentLinks: 'payment-links' } as const;

export type ThirdPartyConfigurationTab =
    (typeof THIRD_PARTY_CONFIGURATION_TABS)[keyof typeof THIRD_PARTY_CONFIGURATION_TABS];

export type ChargeTerms = { percentage: number; fixed: number };

export type PaymentLinkCharge = ChargeTerms & {
    updatedAt: string | null;
    recordedByName: string | null;
};

export type ChargeSource = 'custom' | 'default' | 'none';

export type PaymentLinkOnboardingStatus =
    'pending' | 'active' | 'suspended' | 'rejected' | 'approval-pending' | 'on_hold';

export type PaymentLinkChargeRow = {
    credentialId: number;
    corporate: { name: string | null; username: string | null; partnerId: string | null };
    onboarding: {
        status: PaymentLinkOnboardingStatus;
        provider: string | null;
        activatedAt: string | null;
    } | null;
    charge: PaymentLinkCharge | null;
    effective: { percentage: number | null; fixed: number | null; source: ChargeSource };
};

export type PaymentLinkChargeScope = 'all' | 'custom';

export type PaymentLinkChargeSortField = 'corporate' | 'status' | 'updatedAt';

export type PaymentLinkChargesFilters = {
    page: number;
    itemsPerPage: number;
    searchText: string;
    scope: PaymentLinkChargeScope;
    sort?: 'ASC' | 'DESC' | '';
    sortField?: PaymentLinkChargeSortField | '';
};

export type PaymentLinkChargesResponse = {
    defaultCharge: PaymentLinkCharge | null;
    corporates: PaymentLinkChargeRow[];
    recordsTotal: number;
    customTotal: number;
    page: number;
    itemsPerPage: number;
};
