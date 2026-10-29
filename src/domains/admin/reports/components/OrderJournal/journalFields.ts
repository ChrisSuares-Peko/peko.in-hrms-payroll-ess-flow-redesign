// Shared list of the flat, editable financial numbers computeJournalData produces —
// used by both the read-only "Financial Breakdown" view and the retry edit form, so
// they always show/edit exactly the same fields.
export const FIELD_LABELS: Record<string, string> = {
    commissionIncludingGST: 'Commission Incl. GST',
    commissionExcludingGST: 'Commission Excl. GST',
    outputGSTonCommission: 'Output GST on Commission',
    vendorPayable: 'Vendor Payable',
    platformFeeIncludingGST: 'Platform Fee Incl. GST',
    platformFeeExcludingGST: 'Platform Fee Excl. GST',
    outputGSTonPlatformFee: 'Output GST on Platform Fee',
    gatewayFee: 'Gateway Fee',
    inputGSTonGatewayFee: 'Input GST on Gateway Fee',
    gatewayCharge: 'Gateway Charge',
    paymentThroughGateway: 'Payment Through Gateway',
    paymentThroughWallet: 'Payment Through Wallet',
    walletAmount: 'Wallet Amount',
    partnerShipFee: 'Partnership Fee',
    partnerPayable: 'Partner Payable',
    inputGSTonPartnerShipFee: 'Input GST on Partnership Fee',
    couponTotalDiscount: 'Coupon Discount (Total)',
    netTransactionAmount: 'Net Transaction Amount',
    totalTransactionAmount: 'Total Transaction Amount',
    netSubscriptionIncome: 'Net Subscription Income',
    outputGSTonRevenue: 'Output GST on Revenue',
    principalSalesPayable: 'Principal Sales Payable',
    outputGSTonPrincipalCommission: 'Output GST on Principal Commission',
    principalCommissionExcludingGST: 'Principal Commission Excl. GST',
    gstRatePct: 'GST Rate',
};

export const EXCLUDED_KEYS = new Set([
    'journalAccountIds',
    'recordJournalEntry',
    'surchargeNotConfiguredPackageId',
]);

// Numeric fields that are a percentage, not a currency amount — rendered with a "%" suffix
// instead of the "₹" prefix used for every other field in the Financial Breakdown.
export const PERCENT_KEYS = new Set(['gstRatePct']);

// Groups related fields together (amount -> its GST -> what it fed into) instead of
// whatever order computeJournalData happened to set the keys in.
export const FIELD_ORDER = [
    'totalTransactionAmount',
    'netTransactionAmount',
    'paymentThroughGateway',
    'paymentThroughWallet',
    'gatewayCharge',
    'walletAmount',
    'gatewayFee',
    'inputGSTonGatewayFee',
    'commissionIncludingGST',
    'commissionExcludingGST',
    'outputGSTonCommission',
    'vendorPayable',
    'principalSalesPayable',
    'principalCommissionExcludingGST',
    'outputGSTonPrincipalCommission',
    'platformFeeIncludingGST',
    'platformFeeExcludingGST',
    'outputGSTonPlatformFee',
    'couponTotalDiscount',
    'partnerShipFee',
    'inputGSTonPartnerShipFee',
    'partnerPayable',
    'netSubscriptionIncome',
    'outputGSTonRevenue',
];

// Every figure a hand-recorded sale can carry, in the table's order; the figures the pipeline
// no longer produces are left out.
const RETIRED_KEYS = new Set(['walletAmount', 'gatewayFee', 'inputGSTonGatewayFee']);

export const MANUAL_SPLIT_KEYS = FIELD_ORDER.filter(key => !RETIRED_KEYS.has(key));

export const camelToTitle = (key: string) =>
    key
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
        .replace(/^./, s => s.toUpperCase());

export const getFinancialFields = (
    journalData: Record<string, any>
): { key: string; label: string; isPercent: boolean }[] => {
    const numericKeys = Object.entries(journalData || {})
        .filter(([key, val]) => !EXCLUDED_KEYS.has(key) && typeof val === 'number')
        .map(([key]) => key);

    const ordered = FIELD_ORDER.filter(key => numericKeys.includes(key));
    const remaining = numericKeys.filter(key => !FIELD_ORDER.includes(key));

    return [...ordered, ...remaining].map(key => ({
        key,
        label: FIELD_LABELS[key] ?? camelToTitle(key),
        isPercent: PERCENT_KEYS.has(key),
    }));
};
