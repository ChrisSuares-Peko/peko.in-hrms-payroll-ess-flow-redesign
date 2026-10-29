import { accessKeys } from '@utils/accessKeys';
import {
    BillingCycle,
    ComparisonCell,
    ComparisonColumn,
    ComparisonFeature,
    PlanCardVM,
} from '@utils/plansLandingData';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import {
    DiscountResult,
    PackageDetails,
    PackagePrices,
    ServicePackage,
    SubscriptionPricingResponse,
    WhatsAppPlan,
} from '../types';

export const PLAN_DETAILS_SESSION_KEY = 'PlanDetails';

// Individual à-la-carte services tracked with a "_subscribe_clicked" Moengage event when their
// "Subscribe Now" button is clicked (à-la-carte plan cards on the main Plans page, and each
// service's own dedicated landing page). Package/service name casing lowercases cleanly for all
// four (payroll/invoicing/esign/turbo), so the event name is derived, not mapped.
export const SUBSCRIBE_CLICKED_SERVICES = new Set(['Payroll', 'Invoicing', 'eSign', 'Turbo']);

export function trackSubscribeClicked(serviceName?: string) {
    if (
        serviceName &&
        SUBSCRIBE_CLICKED_SERVICES.has(serviceName) &&
        typeof Moengage?.track_event === 'function'
    ) {
        Moengage.track_event(`${serviceName.toLowerCase()}_subscribe_clicked`);
    }
}

export function calculateDiscount(
    actualPrice: string | number,
    discountAmount: number
): DiscountResult {
    if (Number(actualPrice) <= 0) {
        return { discountedAmount: 0, discountPercentage: 0 };
    }

    const discountedAmount = Number(actualPrice) - discountAmount;
    const discountPercentage = (discountAmount / Number(actualPrice)) * 100;

    return {
        discountedAmount,
        discountPercentage: parseFloat(discountPercentage.toFixed(2)), // rounding to 2 decimal places
    };
}

export function calculateMaxDiscountPercentages(
    packages: ServicePackage[] | PackageDetails[]
): PackagePrices {
    let maxMonthlyDiscountPercentage: number = 0;
    let maxAnnualDiscountPercentage: number = 0;

    packages.forEach(pkg => {
        const { packagePrices, discount } = pkg;
        const { discountPercentage: monthlyDiscount } = calculateDiscount(
            packagePrices.monthly,
            discount.monthly
        );
        const { discountPercentage: yearlyDiscount } = calculateDiscount(
            packagePrices.annually,
            discount.annually
        );
        if (monthlyDiscount > maxMonthlyDiscountPercentage) {
            maxMonthlyDiscountPercentage = monthlyDiscount;
        }
        if (yearlyDiscount > maxAnnualDiscountPercentage) {
            maxAnnualDiscountPercentage = yearlyDiscount;
        }
    });

    return {
        monthly: maxMonthlyDiscountPercentage.toString(),
        annually: maxAnnualDiscountPercentage.toString(),
    };
}

export function getWhatsAppPlanDescription(
    whatsappPlans: WhatsAppPlan[] | undefined,
    type: 'monthly' | 'annually',
    packageName: string
): string | null {
    if (!whatsappPlans || whatsappPlans.length === 0) return null;

    const basicPlan = whatsappPlans.find(p => p.packageName.toLowerCase().includes('basic'));
    const proPlan = whatsappPlans.find(p => p.packageName.toLowerCase().includes('pro'));
    if (!basicPlan || !proPlan) return null;

    const suffix = type === 'monthly' ? '/mo' : '/yr';
    const { discountedAmount: basicPrice } = calculateDiscount(
        basicPlan.packagePrices[type],
        Number(basicPlan.discount[type])
    );
    const { discountedAmount: proPrice } = calculateDiscount(
        proPlan.packagePrices[type],
        Number(proPlan.discount[type])
    );
    const basicStr = formatNumberWithLocalString(basicPrice, 0);
    const proStr = formatNumberWithLocalString(proPrice, 0);

    // TEMP: Peko+ → WhatsApp Basic bundling disabled. Peko+ now shows WhatsApp Basic PRICED (same as other
    // plans) instead of "Basic included", since Peko+ no longer bundles a free WhatsApp Basic. Both branches
    // are identical on purpose while disabled; to re-enable, restore the Peko+ branch to `Basic included · Pro …`.
    return packageName === 'Peko+'
        ? `Basic ₹${basicStr}${suffix} · Pro ₹${proStr}${suffix}`
        : `Basic ₹${basicStr}${suffix} · Pro ₹${proStr}${suffix}`;
}

// ── Service display name + format map ────────────────────────────────────────
// label   : display name shown as the row header
// order   : display position (matches the master service list order)
// format  : optional fn(unitPrice, baseLimit) → string shown per plan cell
//           if omitted, or if both unitPrice & baseLimit are 0, a tick is shown

export interface PlanServiceDefinition {
    label: string;
    group?: string;
    order?: number;
    /** Set to true when the format relies on surcharge (not unitPrice/baseLimit) to determine if there's data to show */
    usesSurcharge?: boolean;
    format?: (
        unitPrice: number,
        baseLimit: number,
        surcharge?: number,
        surchargeType?: string
    ) => string;
}

const verificationDef = (unitPrice: number, baseLimit: number) => {
    const parts: string[] = [];
    if (baseLimit > 0) parts.push(`${baseLimit} free/month`);
    if (unitPrice > 0) parts.push(`₹${unitPrice} per extra`);
    return parts.join(' · ');
};

const surchargePerTxn = (surcharge?: number, surchargeType?: string) => {
    if (!surcharge || surcharge <= 0) return '';
    if (surchargeType === 'PERCENTAGE') return `${surcharge}%/txn`;
    if (surchargeType === 'FLAT') return `₹${surcharge}/txn`;
    return '';
};

const invoicingDef = (unitPrice: number, baseLimit: number, surcharge?: number) => {
    const parts: string[] = ['Unlimited invoices'];
    if (baseLimit > 0 && unitPrice > 0) {
        parts.push(`${baseLimit} e-Invoices/mo (₹${unitPrice}/extra)`);
    } else if (baseLimit > 0) {
        parts.push(`${baseLimit} e-Invoices/mo`);
    } else if (unitPrice > 0) {
        parts.push(`₹${unitPrice} per e-Invoice`);
    }
    if (surcharge && surcharge > 0) {
        parts.push(`${surcharge}%/txn to collect payment`);
    }
    return parts.join(' · ');
};

const GOVERNMENT_SERVICE_KEYS = [
    accessKeys.gstRegistration,
    accessKeys.ptRegistration,
    accessKeys.shopEstablishment,
    accessKeys.tanRegistration,
    accessKeys.epfRegistration,
    accessKeys.esiRegistration,
    accessKeys.panRegistration,
    accessKeys.gstComposition,
    accessKeys.msmeRegistration,
    accessKeys.trademarkRegistration,
    accessKeys.startupIndia,
    accessKeys.isoCertification,
    accessKeys.fssaiBasic,
    accessKeys.fssaiState,
    accessKeys.fssaiCentral,
    accessKeys.drugLicenseRetail,
    accessKeys.drugLicenseWholesale,
    accessKeys.drugManufacturing,
    accessKeys.registration12A80G,
    accessKeys.fcraRegistration,
    accessKeys.tradeLicense,
    accessKeys.fireSafetyNoc,
    accessKeys.pcbConsent,
    accessKeys.factoryLicense,
    accessKeys.reraPromoter,
    accessKeys.reraAgent,
    accessKeys.iecRegistration,
    accessKeys.dsc,
];

const governmentServicesEntries: Record<string, PlanServiceDefinition> = Object.fromEntries(
    GOVERNMENT_SERVICE_KEYS.map(key => [
        key,
        {
            label: 'Government Services',
            group: 'government_services',
            order: 240,
        },
    ])
);

export const planServicesMap: Record<string, PlanServiceDefinition> = {
    // ─── Entries with format (Sr. 1–12) ──────────────────────────────────────
    // ── Sr. 1: Payroll ───────────────────────────────────────────────────────
    [accessKeys.payroll]: {
        label: 'Payroll',
        order: 10,
        format: (unitPrice, baseLimit) =>
            unitPrice > 0
                ? `Up to ${baseLimit} employees; additional employees at ₹${unitPrice} per seat/mo`
                : `Up to ${baseLimit} employees`,
    },
    // ── Sr. 2: WhatsApp for Business ─────────────────────────────────────────
    // [accessKeys.whatsappBasic]: {
    //     label: 'WhatsApp for Business',
    //     order: 20,
    //     // TEMP: Peko+ → WhatsApp Basic bundling disabled. When unitPrice is 0 (the Peko+ bundled-WhatsApp
    //     // case), do NOT advertise "Basic included" — show Pro only. When unitPrice > 0 show Basic priced.
    //     // To re-enable, restore the `: 'Basic included'` branch below.
    //     format: (unitPrice, baseLimit) =>
    //         unitPrice === 0 && baseLimit === 0
    //             ? ''
    //             : `${unitPrice > 0 ? `Basic ₹${unitPrice}/mo · ` : ''}Pro ₹${baseLimit}/mo`,
    // },
    // ── Sr. 3: eSign ─────────────────────────────────────────────────────────
    [accessKeys.eSignDrive]: {
        label: 'eSign',
        order: 30,
        format: (unitPrice, baseLimit) => {
            if (baseLimit > 0 && unitPrice > 0)
                return `${baseLimit} free/month · ₹${unitPrice} extra/doc`;
            if (baseLimit > 0) return `${baseLimit} free/month`;
            if (unitPrice > 0) return `₹${unitPrice} per document`;
            return '';
        },
    },
    // ── Sr. 4: Verification Suite ────────────────────────────────────────────
    [accessKeys.panVerify]: {
        label: 'Verification Suite ',
        group: 'verification_suite',
        order: 40,
        format: verificationDef,
    },
    [accessKeys.advancePanVerify]: {
        label: 'Verification Suite ',
        group: 'verification_suite',
        order: 40,
        format: verificationDef,
    },
    [accessKeys.aadharVerify]: {
        label: 'Verification Suite ',
        group: 'verification_suite',
        order: 40,
        format: verificationDef,
    },
    [accessKeys.aadharOcrVerify]: {
        label: 'Verification Suite ',
        group: 'verification_suite',
        order: 40,
        format: verificationDef,
    },
    [accessKeys.bankAccountVerify]: {
        label: 'Verification Suite ',
        group: 'verification_suite',
        order: 40,
        format: verificationDef,
    },
    [accessKeys.ifscVerify]: {
        label: 'Verification Suite ',
        group: 'verification_suite',
        order: 40,
        format: verificationDef,
    },
    [accessKeys.dlVerify]: {
        label: 'Verification Suite ',
        group: 'verification_suite',
        order: 40,
        format: verificationDef,
    },
    [accessKeys.voterIdVerify]: {
        label: 'Verification Suite ',
        group: 'verification_suite',
        order: 40,
        format: verificationDef,
    },
    [accessKeys.passportVerify]: {
        label: 'Verification Suite ',
        group: 'verification_suite',
        order: 40,
        format: verificationDef,
    },
    [accessKeys.gstinVerify]: {
        label: 'Verification Suite ',
        group: 'verification_suite',
        order: 40,
        format: verificationDef,
    },
    [accessKeys.gstinPan]: {
        label: 'Verification Suite ',
        group: 'verification_suite',
        order: 40,
        format: verificationDef,
    },
    [accessKeys.gstBusinessVerify]: {
        label: 'Verification Suite ',
        group: 'verification_suite',
        order: 40,
        format: verificationDef,
    },
    [accessKeys.gstReturnCheck]: {
        label: 'Verification Suite ',
        group: 'verification_suite',
        order: 40,
        format: verificationDef,
    },
    [accessKeys.cinVerify]: {
        label: 'Verification Suite ',
        group: 'verification_suite',
        order: 40,
        format: verificationDef,
    },
    [accessKeys.directorVerifyCin]: {
        label: 'Verification Suite ',
        group: 'verification_suite',
        order: 40,
        format: verificationDef,
    },
    [accessKeys.directorVerifyDin]: {
        label: 'Verification Suite ',
        group: 'verification_suite',
        order: 40,
        format: verificationDef,
    },
    // ── Sr. 5: Turbo ─────────────────────────────────────────────────────────
    [accessKeys.garage]: {
        label: 'Turbo',
        order: 50,
        format: (unitPrice, baseLimit) => {
            const parts: string[] = [];
            if (baseLimit > 0) parts.push(`${baseLimit} RC × ${baseLimit} DL/month`);
            if (unitPrice > 0) parts.push(`₹${unitPrice} per extra`);
            return parts.join(' · ');
        },
    },
    // ── Sr. 6: Invoicing ────────────────────────────────────────────────────
    [accessKeys.eInvoice]: {
        label: 'Invoicing & e-Invoicing',
        group: 'invoicing',
        order: 60,
        usesSurcharge: true,
        format: invoicingDef,
    },
    [accessKeys.invoices]: {
        label: 'Invoicing & e-Invoicing',
        group: 'invoicing',
        order: 60,
        usesSurcharge: true,
        format: invoicingDef,
    },
    // ── Sr. 7: Payment Links ────────────────────────────────────────────────
    [accessKeys.planPaymentLinks]: {
        label: 'Payment Links',
        order: 70,
        usesSurcharge: true,
        format: (_u, _b, surcharge) => `Amount + ${surcharge}%/txn`,
    },
    // ── Sr. 8: Payouts ──────────────────────────────────────────────────────
    [accessKeys.vendorPayouts]: {
        label: 'Payouts',
        order: 80,
        usesSurcharge: true,
        format: (_u, _b, surcharge, surchargeType) => surchargePerTxn(surcharge, surchargeType),
    },
    // ── Sr. 9: Sales ────────────────────────────────────────────────────────
    [accessKeys.sales]: {
        label: 'SalesX',
        order: 90,
        usesSurcharge: true,
        format: (unitPrice, _b, surcharge) =>
            unitPrice > 0
                ? `Unlimited agreements · eSign at ₹${unitPrice}/doc · ${surcharge}%/txn to collect payment`
                : `Unlimited agreements · ${surcharge}%/txn to collect payment`,
    },
    // ── Sr. 10: Procure ──────────────────────────────────────────────────────
    [accessKeys.procure]: {
        label: 'Procure',
        order: 100,
        usesSurcharge: true,
        format: (_u, _b, surcharge, surchargeType) => surchargePerTxn(surcharge, surchargeType),
    },
    // ── Sr. 11: Corporate Cards ───────────────────────────────────────────────
    [accessKeys.corporateCards]: {
        label: 'Corporate Cards',
        order: 110,
        format: (unitPrice, baseLimit) => {
            if (baseLimit === 0) {
                return unitPrice > 0
                    ? `Virtual cards only · Physical cards at ₹${unitPrice}/card + GST`
                    : `Virtual cards only`;
            }
            return unitPrice > 0
                ? `${baseLimit} Physical + unlimited virtual · Additional physical cards ₹${unitPrice} + GST`
                : `${baseLimit} Physical + unlimited virtual`;
        },
    },
    // ─── Entries without format (Sr. 13–37) ──────────────────────────────────
    // ── Sr. 13: Mobile Recharge & Bills ──────────────────────────────────────
    [accessKeys.prepaid]: { label: 'Mobile Recharge & Bills', order: 130 },
    // ── Sr. 14: Utility Payments ─────────────────────────────────────────────
    [accessKeys.billPayments]: {
        label: 'Utility Payments',
        order: 140,
    },
    // ── Sr. 15: Flight Booking ───────────────────────────────────────────────
    [accessKeys.airline]: { label: 'Flight Booking', order: 150 },
    // ── Sr. 16: Hotel Booking ────────────────────────────────────────────────
    [accessKeys.hotels]: { label: 'Hotel Booking', order: 160 },
    // ── Sr. 17: Gift Cards ───────────────────────────────────────────────────
    [accessKeys.giftCards]: { label: 'Gift Cards', group: 'gift_cards', order: 170 },
    [accessKeys.xoxoday]: { label: 'Gift Cards', group: 'gift_cards', order: 170 },
    // ── Sr. 18: Compliance ───────────────────────────────────────────────────
    [accessKeys.compliance]: { label: 'Compliance', order: 180 },
    // ── Sr. 19: Visa ─────────────────────────────────────────────────────────
    [accessKeys.visa]: { label: 'Visa', order: 190 },
    // ── Sr. 20: Domain & Hosting ─────────────────────────────────────────────
    [accessKeys.domainAndHosting]: { label: 'Domain & Hosting', order: 200 },
    // ── Sr. 21: Softwares Subscriptions ─────────────────────────────────────
    [accessKeys.softwares]: { label: 'Softwares Subscriptions', order: 210 },
    // ── Sr. 22: Tax & More ───────────────────────────────────────────────────
    [accessKeys.taxAndMore]: {
        label: 'Tax & More',
        order: 220,
    },
    // ── Sr. 23: Peko Commerce ────────────────────────────────────────────────
    [accessKeys.ecommerceStore]: { label: 'Peko Commerce', order: 230 },
    // ── Sr. 24: Government Services (category — see GOVERNMENT_SERVICE_KEYS above) ──
    ...governmentServicesEntries,
    // ── Sr. 25: Marketplace ──────────────────────────────────────────────────
    [accessKeys.marketplace]: { label: 'Marketplace', order: 250 },
    // ── Sr. 26: Office Supplies ──────────────────────────────────────────────
    [accessKeys.officeSupplies]: { label: 'Office Supplies (Powered by ONDC)', order: 260 },
    // ── Sr. 27: Legal Services ───────────────────────────────────────────────
    [accessKeys.legalServices]: {
        label: 'Legal Services',
        order: 270,
    },
    // ── Sr. 28: Bus Tickets ──────────────────────────────────────────────────
    [accessKeys.busTickets]: { label: 'Bus tickets', order: 280 },
    // ── Sr. 29: Logistics ────────────────────────────────────────────────────
    [accessKeys.shipmentServices]: { label: 'Logistics', order: 290 },
    // ── Sr. 30: Accounting ───────────────────────────────────────────────────
    [accessKeys.Accounting]: { label: 'Accounting', order: 300 },
    // ── Sr. 31: Works ────────────────────────────────────────────────────────
    [accessKeys.pekoWorks]: { label: 'Works', order: 310 },
    // ── Sr. 32: eSIM ─────────────────────────────────────────────────────────
    // eSIM is served by the Tunz provider (accessKey 'esim_tunz'). The legacy Bondio
    // key ('esim' / accessKeys.eSim) is no longer offered in plans.
    // Shown as an included tick only — no service-charge detail (no `format`/`usesSurcharge`).
    [accessKeys.eSimTunz]: {
        label: 'eSIM',
        group: 'esim_group',
        order: 320,
    },
    // ── Sr. 33: Multicurrency Business Account ───────────────────────────────
    [accessKeys.multicurrencyAccount]: { label: 'Multicurrency Business Account', order: 330 },
    // ── Sr. 34: Insurance ────────────────────────────────────────────────────
    [accessKeys.peko_insurance]: { label: 'Insurance', order: 340 },
    // ── Sr. 35: Global Business Setup ────────────────────────────────────────
    [accessKeys.globalBusinessSetup]: { label: 'Global Business Setup', order: 350 },
    // ── Sr. 36: Peko Flow ────────────────────────────────────────────────────
    [accessKeys.pekoFlow]: { label: 'Peko Flow', order: 360 },
    // ── Sr. 37: Car Leasing ──────────────────────────────────────────────────
    [accessKeys.carLeasing]: { label: 'Car Leasing', order: 370 },
    // ── Sr. 38: Peko POS ─────────────────────────────────────────────────────
    [accessKeys.pekoPos]: { label: 'Peko POS', order: 380 },
};

// ── Tax label (GST add-on) ───────────────────────────────────────────────────
export function formatTaxLabel(taxRate?: number): string {
    const rate = Number(taxRate);
    if (Number.isFinite(rate) && rate > 0) {
        return `GST (${rate}%)`;
    }
    return 'GST';
}

// ── Order-summary rows for a subscription-pricing response (the shared payment screen shows them) ──
export function buildPricingSummary(pricing: SubscriptionPricingResponse) {
    const money = (value: number) => `₹ ${formatNumberWithLocalString(value)}`;
    return [
        { key: 'Base Price', value: money(pricing.packagePrice) },
        ...(pricing.packageDiscount > 0
            ? [{ key: 'Discount', value: money(pricing.packageDiscount) }]
            : []),
        ...(pricing.additionalDiscount > 0
            ? [{ key: 'Remaining Period Credit', value: money(pricing.additionalDiscount) }]
            : []),
        ...(pricing.couponDiscount > 0
            ? [{ key: 'Coupon Discount', value: money(pricing.couponDiscount) }]
            : []),
        ...(Number(pricing.taxAmount) > 0
            ? [
                  { key: 'Subtotal', value: money(Number(pricing.taxableAmount ?? 0)) },
                  { key: formatTaxLabel(pricing.taxRate), value: money(Number(pricing.taxAmount)) },
              ]
            : []),
    ];
}

// ── Landing-page builders (API → view models) ────────────────────────────────
// The plans landing page renders entirely from the live list-packages response.
// These turn the raw packages into the presentational shapes the cards/table need,
// reusing the same planServicesMap + pricing logic as the rest of the plans flow.

/** Build the three plan-card view models (monthly billing) from the live packages. */
export function buildPlanCards(
    plans: ServicePackage[],
    currentPlanDetails: {
        currentPackageId: number;
        currentPlanPriorityLevel: number;
        currentBillingType?: 'MONTHLY' | 'ANNUALLY' | null;
        currentPlanIsCancelled?: boolean;
    }
): PlanCardVM[] {
    // The active billing cycle — only known when the user holds a paid plan; undefined for free/basic
    // (no cycle) or when the backend didn't report one, so we never offer an annual upgrade we're unsure of.
    let currentBillingCycle: BillingCycle | undefined;
    if (currentPlanDetails.currentBillingType === 'ANNUALLY') currentBillingCycle = 'annually';
    else if (currentPlanDetails.currentBillingType === 'MONTHLY') currentBillingCycle = 'monthly';
    const sorted = [...plans].sort((a, b) => a.priorityLevel - b.priorityLevel);
    const currentIdx = sorted.findIndex(p => p.id === currentPlanDetails.currentPackageId);
    // Recommended = the tier just above the current plan (defaults to the first paid tier).
    const recommendedIdx = (currentIdx >= 0 ? currentIdx : 0) + 1;

    return sorted.map((plan, idx) => {
        const { monthly, annually } = plan.packagePrices;
        const isFree = parseFloat(monthly) === 0;
        const { discountedAmount } = calculateDiscount(monthly, Number(plan.discount.monthly));
        const { discountedAmount: annualAmount } = calculateDiscount(
            annually,
            Number(plan.discount.annually)
        );

        let actionType: PlanCardVM['actionType'];
        if (plan.id === currentPlanDetails.currentPackageId) actionType = 'CURRENT';
        else if (plan.priorityLevel > currentPlanDetails.currentPlanPriorityLevel)
            actionType = 'UPGRADE';
        else actionType = 'DOWNGRADE';

        // The current cycle is only carried on a paid current plan — a free plan has no cycle, so it
        // stays "current" on both toggles rather than becoming a bogus annual upgrade.
        const isCurrentPaid = actionType === 'CURRENT' && !isFree;

        return {
            id: plan.id,
            name: plan.packageName,
            tagline: plan.description,
            priceLabel: isFree ? 'Free' : `₹${formatNumberWithLocalString(discountedAmount, 0)}`,
            pricePeriod: isFree ? undefined : '/Month',
            billingNote: isFree ? 'No card required' : 'Billed monthly (excl. GST)',
            annualPriceLabel: isFree ? 'Free' : `₹${formatNumberWithLocalString(annualAmount, 0)}`,
            annualPricePeriod: isFree ? undefined : '/Year',
            annualBillingNote: isFree ? 'No card required' : 'Billed annually (excl. GST)',
            actionType,
            currentBilling: isCurrentPaid ? currentBillingCycle : undefined,
            isCurrentCancelled: isCurrentPaid && Boolean(currentPlanDetails.currentPlanIsCancelled),
            isRecommended: idx === recommendedIdx && actionType === 'UPGRADE',
            // Top paid tier (highest priorityLevel — e.g. Peko+) carries the green "Best Value" tag.
            isBestValue: idx === sorted.length - 1 && !isFree,
        };
    });
}

/** Build the comparison table (columns + feature rows) from the live packages, monthly billing. */
export function buildComparisonData(
    plans: ServicePackage[],
    whatsappPlans?: WhatsAppPlan[]
): { columns: ComparisonColumn[]; rows: ComparisonFeature[] } {
    const sorted = [...plans].sort((a, b) => a.priorityLevel - b.priorityLevel);

    const columns: ComparisonColumn[] = sorted.map(plan => {
        const { monthly } = plan.packagePrices;
        const isFree = parseFloat(monthly) === 0;
        const { discountedAmount } = calculateDiscount(monthly, Number(plan.discount.monthly));
        return {
            name: plan.packageName,
            price: isFree ? 'Free' : `₹${formatNumberWithLocalString(discountedAmount, 0)}/mo`,
        };
    });

    const availableKeys = new Set(sorted.flatMap(p => p.services.map(s => s.accessKey)));

    // Collapse same-group services into a single row; a group/service no plan offers is "Coming Soon".
    const seenGroups = new Set<string>();
    type RowDef = {
        accessKey: string;
        definition: PlanServiceDefinition;
        groupKeys: string[];
    };
    const rowDefs: RowDef[] = [];
    Object.entries(planServicesMap)
        .sort(([, a], [, b]) => (a.order ?? 999) - (b.order ?? 999))
        .forEach(([key, definition]) => {
            if (definition.group) {
                if (seenGroups.has(definition.group)) return;
                seenGroups.add(definition.group);
                const availableGroupKeys = Object.entries(planServicesMap)
                    .filter(([k, d]) => d.group === definition.group && availableKeys.has(k))
                    .map(([k]) => k);
                if (availableGroupKeys.length === 0) return;
                rowDefs.push({
                    accessKey: key,
                    definition,
                    groupKeys: availableGroupKeys,
                });
            } else {
                if (!availableKeys.has(key)) return;
                rowDefs.push({
                    accessKey: key,
                    definition,
                    groupKeys: [key],
                });
            }
        });

    const rows: ComparisonFeature[] = rowDefs.map(({ accessKey, definition, groupKeys }) => {
        const cells = sorted.map<ComparisonCell>(plan => {
            const svc = groupKeys
                .map(k => plan.services.find(s => s.accessKey === k))
                .find(Boolean);
            const bothZero =
                !svc ||
                (svc.unitPrice === 0 &&
                    svc.baseLimit === 0 &&
                    !(definition.usesSurcharge && svc.surcharge));

            let text: string | null =
                svc && definition.format && !bothZero
                    ? definition.format(
                          svc.unitPrice,
                          svc.baseLimit,
                          svc.surcharge,
                          svc.surchargeType
                      )
                    : null;

            // WhatsApp Basic/Pro pricing comes from the separate whatsappPlans source.
            if (accessKey === accessKeys.whatsappBasic) {
                const waText = getWhatsAppPlanDescription(
                    whatsappPlans,
                    'monthly',
                    plan.packageName
                );
                if (waText) text = waText;
            }

            if (text) return { kind: 'text', value: text };
            if (!svc) return { kind: 'none' };
            return { kind: 'check' };
        });

        return { label: definition.label, cells };
    });

    return { columns, rows };
}
