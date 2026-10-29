export interface SubCategoryOption {
    label: string;
    value: string;
}

export interface CategoryOption {
    label: string;
    value: string;
    subCategories: SubCategoryOption[];
}

export const ISSUE_TAXONOMY: CategoryOption[] = [
    {
        label: 'Payment issues',
        value: 'ORDER',
        subCategories: [
            { label: 'Extra amount deducted', value: 'Extra amount deducted' },
            { label: 'Order not confirmed', value: 'Order not confirmed' },
            { label: 'Cancellation request not accepted', value: 'Cancellation request not accepted' },
            { label: 'Other', value: 'Other' },
        ],
    },
    {
        label: 'Delayed Delivery',
        value: 'FULFILLMENT',
        subCategories: [
            { label: 'Delay in delivery', value: 'Delay in delivery' },
            { label: 'Delivery agent behaved rudely', value: 'Delivery agent behaved rudely' },
            { label: 'Item damaged in transit', value: 'Item damaged in transit' },
            { label: 'Other', value: 'Other' },
        ],
    },
    {
        label: 'Item issues',
        value: 'ITEM',
        subCategories: [
            { label: 'Incorrect item delivered', value: 'Incorrect item delivered' },
            { label: 'Defective item', value: 'Defective item' },
            { label: 'Shortage of items', value: 'Shortage of items' },
            { label: 'Other', value: 'Other' },
        ],
    },
    {
        label: 'Agent issues',
        value: 'AGENT',
        subCategories: [
            { label: 'Seller unresponsive', value: 'Seller unresponsive' },
            { label: 'Grievance officer details not found', value: 'Grievance officer details not found' },
            { label: 'Other', value: 'Other' },
        ],
    },
];

export const mapCategoryToDisplay = (cat: string): string => {
    const found = ISSUE_TAXONOMY.find(c => c.value === cat);
    return found ? found.label : cat;
};

/** IGM 2.0 descriptor.code values Workbench sends instead of a human sub-category. */
const IGM_SUBCATEGORY_LABELS: Record<string, string> = {
    ITM001: 'Missing item',
    ITM002: 'Incorrect item',
    ITM003: 'Damaged item',
    ITM004: 'Product quality',
    FLM002: 'Delay in delivery',
    ORD001: 'Order issue',
    AGT001: 'Agent issue',
};

export const mapSubCategoryToDisplay = (code?: string | null): string => {
    if (!code) return '';
    return IGM_SUBCATEGORY_LABELS[code.toUpperCase()] || code;
};

/** IGM 2.0 issue.status — OPEN | PROCESSING | RESOLVED | CLOSED. */
export type OndcIssueWireStatus = 'OPEN' | 'PROCESSING' | 'RESOLVED' | 'CLOSED';

const INTERNAL_TO_WIRE_STATUS: Record<string, OndcIssueWireStatus> = {
    OPEN: 'OPEN',
    ESCALATED: 'OPEN',
    RESOLVED: 'RESOLVED',
    CLOSED: 'CLOSED',
};

export const mapIssueStatusToWire = (status?: string | null): OndcIssueWireStatus => {
    const key = String(status || '').toUpperCase();
    return INTERNAL_TO_WIRE_STATUS[key] || 'PROCESSING';
};

const WIRE_STATUS_PILL: Record<OndcIssueWireStatus, { label: string; className: string }> = {
    OPEN: { label: 'Open', className: 'bg-[#F5F6FF] text-[#3B48D5]' },
    PROCESSING: { label: 'Processing', className: 'bg-[#FFEBC9] text-[#D97706]' },
    RESOLVED: { label: 'Resolved', className: 'bg-[#E7FFEC] text-[#008000]' },
    CLOSED: { label: 'Closed', className: 'bg-[#F5F5F5] text-[#595959]' },
};

export const getIssueWireStatusPill = (wireStatus?: string | null, fallbackInternal?: string | null) => {
    const key = String(wireStatus || mapIssueStatusToWire(fallbackInternal)).toUpperCase();
    return WIRE_STATUS_PILL[key as OndcIssueWireStatus] || WIRE_STATUS_PILL.PROCESSING;
};
