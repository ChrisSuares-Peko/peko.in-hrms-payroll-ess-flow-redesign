import { AuditAction, AuditChange, AuditSource } from '../types/auditTrail';

export const CONFIG_TYPE_LABELS: Record<string, string> = {
    SERVICE_COMMISSION: 'Service commission',
    SERVICE_VENDOR: 'Service vendor',
    PLAN_COMMISSION: 'Plan commission',
    PLAN_PRICE: 'Plan price',
    PLATFORM_FEE: 'Platform fee',
    CASHBACK: 'Cashback',
    SUBSCRIPTION_PRICING: 'Subscription pricing',
    SUBSCRIPTION_STATUS: 'Subscription status',
    SUBSCRIPTION_ADDON: 'Subscription add-on',
    WHITELABEL_SHARE: 'Whitelabel share',
    WHITELABEL_STATUS: 'Whitelabel status',
    VENDOR_LEDGER: 'Vendor ledger entry',
    PARTNER_LEDGER: 'Partner ledger entry',
    GATEWAY_LEDGER: 'Gateway ledger entry',
    VENDOR_INVOICE: 'Vendor invoice',
    PAYMENT_LINK_CHARGE: 'Payment link charge',
};

export const CONFIG_TYPE_OPTIONS = Object.entries(CONFIG_TYPE_LABELS).map(([value, label]) => ({
    value,
    label,
}));

export const SOURCE_LABELS: Record<AuditSource, string> = {
    ACCOUNTING_PORTAL: 'Accounting Portal',
    ADMIN_PANEL: 'Admin Panel',
};

export const SOURCE_OPTIONS = (Object.keys(SOURCE_LABELS) as AuditSource[]).map(value => ({
    value,
    label: SOURCE_LABELS[value],
}));

export const ACTION_LABELS: Record<AuditAction, string> = {
    CREATE: 'Created',
    UPDATE: 'Updated',
    DELETE: 'Deleted',
};

const FIELD_LABELS: Record<string, string> = {
    commissionMode: 'Commission mode',
    commissionType: 'Commission type',
    providerCommission: 'Commission',
    commission: 'Commission',
    fixedCommissionPerTransaction: 'Fixed amount per transaction',
    isCommissionInclGST: 'GST included in commission',
    isCommissionConfigured: 'Commission marked configured',
    planCommissions: 'Split commission',
    surchargeType: 'Platform fee type',
    surcharge: 'Platform fee',
    isSurchargeConfigured: 'Platform fee marked configured',
    cashbackType: 'Cashback type',
    cashback: 'Cashback',
    serviceStatus: 'Switched on',
    unitPrice: 'Unit price',
    baseLimit: 'Base limit',
    price: 'Price',
    monthlyPrice: 'Monthly price',
    yearlyPrice: 'Yearly price',
    packagePrices: 'Prices',
    discount: 'Discount',
    sharePercentage: 'Share %',
    gatewayCharge: 'Gateway charge',
    accountingCharge: 'Payment link charge',
    percentage: 'Charge %',
    fixed: 'Charge per transaction',
    brandingStatus: 'Whitelabel on',
    status: 'Switched on',
    vendorName: 'Vendor name',
    state: 'State',
    gstNo: 'GST number',
    address: 'Address',
    vendorEmail: 'Vendor email',
    amount: 'Amount',
    taxableAmount: 'Taxable amount',
    gst: 'GST',
    gstRate: 'GST rate',
    gstInclusive: 'Amount entered inclusive of GST',
    date: 'Date',
    reference: 'Reference',
    mode: 'Mode',
    note: 'Note',
    reason: 'Reason',
    againstOrder: 'Against order',
    document: 'Document',
    changeReason: 'Reason given',
    booksSynced: 'Synced to books',
    removedFromPortal: 'Removed from the portal',
    companyName: 'Billed to: company',
    gstin: 'Billed to: GSTIN',
    placeOfSupply: 'Place of supply',
    taxCase: 'Tax split',
    sentTo: 'Sent to',
};

export const EMPTY_VALUE = '—';

export const DEFAULT_PARTNER = 'Peko (Default)';

export const fieldLabel = (field: string) => FIELD_LABELS[field] || field;

const isPrimitive = (value: unknown): value is string | number | boolean =>
    ['string', 'number', 'boolean'].includes(typeof value);

export const formatChangeValue = (value: unknown): string => {
    if (value === null || value === undefined || value === '') return EMPTY_VALUE;
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') return String(Number(value.toFixed(4)));
    if (typeof value === 'string') return value;
    if (Array.isArray(value) && value.every(isPrimitive)) return value.join(', ');
    if (typeof value === 'object') {
        const entries = Object.entries(value as Record<string, unknown>);
        if (entries.every(([, item]) => isPrimitive(item) || item === null)) {
            return entries.map(([key, item]) => `${key}: ${formatChangeValue(item)}`).join(', ');
        }
    }
    return JSON.stringify(value);
};

export const describeChange = (change: AuditChange, action: AuditAction = 'UPDATE') => {
    const label = fieldLabel(change.field);
    if (change.field === 'changeReason') return `${label}: ${formatChangeValue(change.to)}`;
    if (action === 'CREATE') return `${label}: ${formatChangeValue(change.to)}`;
    if (action === 'DELETE') return `${label}: ${formatChangeValue(change.from)}`;
    return `${label}: ${formatChangeValue(change.from)} → ${formatChangeValue(change.to)}`;
};
