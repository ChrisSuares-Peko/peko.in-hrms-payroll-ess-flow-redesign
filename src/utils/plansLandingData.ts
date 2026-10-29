import { accessKeys } from '@utils/accessKeys';

/**
 * Plans landing page (figma 15549-43872 / 15553-45320 / 15553-46016).
 *
 * This module holds ONLY static UI copy and presentational view-model types.
 * All plan/pricing/feature data is built from the live API — see
 * `buildPlanCards` / `buildComparisonData` in `domains/dashboard/plans/utils`.
 */

export type PlanIconKey = 'payroll' | 'procure' | 'salesx' | 'esign' | 'turbo' | 'invoicing';

/** Billing cycle driven by the plans-landing Monthly/Annual toggle. Values match `PlanType`. */
export type BillingCycle = 'monthly' | 'annually';

/** Render-ready main plan card, built from a live ServicePackage. */
export interface PlanCardVM {
    id: number;
    name: string;
    /** Short line under the title (the package description). */
    tagline: string;
    /** Monthly headline price text: "Free" or "₹999". */
    priceLabel: string;
    /** Suffix next to a paid monthly price ("/Month"); omitted for the free plan. */
    pricePeriod?: string;
    billingNote: string;
    /** Annual counterparts, shown when the billing toggle is set to "Annual". */
    annualPriceLabel: string;
    annualPricePeriod?: string;
    annualBillingNote: string;
    actionType: 'CURRENT' | 'UPGRADE' | 'DOWNGRADE';
    /**
     * For the current plan only — the user's active billing cycle. Lets the card treat the
     * *other* cycle of the same package as a purchasable upgrade (e.g. monthly user buying
     * annual) instead of blocking it as "current". `undefined` for a free/basic plan (no cycle).
     */
    currentBilling?: BillingCycle;
    /** Current paid plan is cancelled — suppresses the monthly→annual upgrade CTA. */
    isCurrentCancelled?: boolean;
    /** The recommended upgrade (tier just above the current plan) is highlighted. */
    isRecommended: boolean;
    /** The top paid tier (e.g. Peko+) carries a green "Best Value" tag. */
    isBestValue: boolean;
}

/** Render-ready individual à-la-carte card, built from a live IndividualPlan. */
export interface IndividualServiceView {
    /** Live individual package id — starts the subscribe flow. */
    id: number;
    name: string;
    description: string;
    priceLabel: string;
    pricePeriod: string;
    /** Optional design illustration; the card falls back to `logo` when absent. */
    iconKey?: PlanIconKey;
    /** Real package logo URL from the API. */
    logo?: string;
    /** User already holds this plan (active) — the card disables re-purchase. */
    isOwned: boolean;
}

export type ComparisonCell =
    | { kind: 'check' }
    | { kind: 'soon' }
    | { kind: 'text'; value: string }
    | { kind: 'none' };

export interface ComparisonColumn {
    name: string;
    price: string;
}

export interface ComparisonFeature {
    label: string;
    /** One cell per column, in the same order as the columns. */
    cells: ComparisonCell[];
}

export const landingHeader = {
    title: 'Everything your business needs, in one plan.',
    subtitle: 'All plans include access to the Peko platform. No hidden fees.',
    billingNote: 'Flexible billing · Cancel anytime',
};

/** Copy for the Monthly / Annual billing toggle. The annual "% off" is computed from live prices. */
export const billingToggle = {
    monthly: 'Monthly',
    annual: 'Annual',
};

export const individualSectionLabel = 'or just need one?';

/**
 * Optional design illustration per individual service, keyed by the individual package's
 * accessCode. When a plan's accessCode isn't mapped here, the card falls back to the real
 * package logo from the API.
 */
export const individualServiceIcons: Record<string, PlanIconKey> = {
    [accessKeys.payroll]: 'payroll',
    [accessKeys.procure]: 'procure',
    [accessKeys.sales]: 'salesx',
    [accessKeys.eSign]: 'esign',
};

/** Fallback lookup by package name, for individual packages whose accessCode isn't mapped above. */
export const individualServiceIconsByName: Record<string, PlanIconKey> = {
    Payroll: 'payroll',
    Procure: 'procure',
    SalesX: 'salesx',
    eSign: 'esign',
    Turbo: 'turbo',
    Invoicing: 'invoicing',
};

export const compareSection = {
    title: 'Compare every feature',
    subtitle: "See exactly what's included in each plan, side by side.",
};

/** Anchor id + label for the jump link that scrolls down to the comparison table. */
export const comparisonTableAnchorId = 'feature-comparison-table';
export const comparePlansLabel = 'Compare Plans';

export const trustBadges: string[] = [
    'No hidden fees',
    'Cancel anytime',
    'GST invoice on every plan',
    'Switch plans anytime',
];
