import { CommissionMode, CommissionType, ServicePlan } from '../types/services';

export const COMMISSION_MODE_OPTIONS: { value: CommissionMode; label: string }[] = [
    { value: 'MARGIN', label: 'Margin' },
    { value: 'AGENT_MARKUP', label: 'Agent Markup' },
    { value: 'PRINCIPAL_MARKUP', label: 'Principal Markup' },
];

export const COMMISSION_TYPE_OPTIONS: { value: CommissionType; label: string }[] = [
    { value: 'PERCENTAGE', label: 'Percentage' },
    { value: 'FLAT', label: 'Flat' },
];

export type PlanExtraColumn = { key: keyof ServicePlan; label: string };

export type PlanTabColumnConfig = {
    extraColumns: PlanExtraColumn[];
    // Extra columns placed right after the Price column (e.g. Annual Price).
    priceExtraColumns?: PlanExtraColumn[];
    hidePriceColumn?: boolean;
    // Defaults to "Price".
    priceColumnLabel?: string;
    // Only set where the backend can filter by an actual partner/credential id.
    hasPartnerFilter?: boolean;
    // Only set where the real admin form has a monthly/annually split-commission toggle.
    supportsSplitCommission?: boolean;
    // Shows the plan price in the single-plan drawer: editable where the admin form locks it,
    // read-only where it only comes from the vendor.
    priceField?: 'editable' | 'readonly';
    // Business Emails: the drawer also has the annual price (monthly is the main price).
    hasAnnualPrice?: boolean;
    // Package plans (WhatsApp, Peko Commerce): the drawer also has the monthly and annual discounts.
    hasDiscount?: boolean;
    // Domain & Hosting only: domain registrations have no plan row of their own
    hasDomainCommissionTab?: boolean;
    // WhatsApp only: its add-ons (Bot Builder, Shopify Integration) get their own price and commission tab
    hasAddOnsTab?: boolean;
};

const DEFAULT_PLAN_TAB_CONFIG: PlanTabColumnConfig = { extraColumns: [] };

// Mirrors others/utils/planEntityConfig.js — decides how to label/lay out each service's Plans table.
export const PLAN_TAB_CONFIG: Record<string, PlanTabColumnConfig> = {
    peko_works: {
        extraColumns: [
            { key: 'workName', label: 'Work Name' },
            { key: 'partnerName', label: 'Partner Name' },
        ],
        hasPartnerFilter: true,
        priceField: 'editable',
    },
    esim_tunz: {
        extraColumns: [],
        priceField: 'readonly',
    },
    hike_service: {
        extraColumns: [
            { key: 'partnerName', label: 'Partner Name' },
            { key: 'planType', label: 'Plan Type' },
        ],
        hasPartnerFilter: true,
        priceField: 'editable',
    },
    workspace: {
        extraColumns: [],
        priceField: 'editable',
    },
    car_report: {
        extraColumns: [],
        priceField: 'editable',
    },
    email_domain_service: {
        extraColumns: [],
        priceExtraColumns: [{ key: 'annualPrice', label: 'Annual Price' }],
        priceColumnLabel: 'Monthly Price',
        priceField: 'editable',
        hasAnnualPrice: true,
    },
    business_registration: {
        extraColumns: [
            { key: 'variantName', label: 'Variant' },
            { key: 'vendorPrice', label: 'Vendor Price' },
        ],
        hidePriceColumn: true,
    },
    gov_services: {
        extraColumns: [
            { key: 'variantName', label: 'Variant' },
            { key: 'vendorPrice', label: 'Vendor Price' },
        ],
        hidePriceColumn: true,
    },
    JRI_prepaid: {
        extraColumns: [{ key: 'displayName', label: 'Display Name' }],
        hidePriceColumn: true,
    },
    xoxoday: {
        extraColumns: [],
        priceColumnLabel: 'Price Range',
    },
    whatsApp_for_busines: {
        extraColumns: [{ key: 'partnerName', label: 'Partner Name' }],
        priceExtraColumns: [{ key: 'annualPrice', label: 'Annual Price' }],
        priceColumnLabel: 'Monthly Price',
        hasPartnerFilter: true,
        supportsSplitCommission: true,
        priceField: 'editable',
        hasAnnualPrice: true,
        hasDiscount: true,
        hasAddOnsTab: true,
    },
    ecommerce_store: {
        extraColumns: [],
        priceExtraColumns: [{ key: 'annualPrice', label: 'Annual Price' }],
        priceColumnLabel: 'Monthly Price',
        supportsSplitCommission: true,
        priceField: 'editable',
        hasAnnualPrice: true,
        hasDiscount: true,
    },
    domain_and_hosting: {
        extraColumns: [
            { key: 'planType', label: 'Plan Type' },
            { key: 'productId', label: 'Product ID' },
        ],
        hidePriceColumn: true,
        hasDomainCommissionTab: true,
    },
};

export const getPlanTabConfig = (accessKey: string): PlanTabColumnConfig =>
    PLAN_TAB_CONFIG[accessKey] ?? DEFAULT_PLAN_TAB_CONFIG;
