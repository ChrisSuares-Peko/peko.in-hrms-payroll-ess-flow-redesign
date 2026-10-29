export const STATUS_COLOR: Record<string, string> = {
    PENDING: 'orange',
    SUBMITTED: 'blue',
    UNDER_REVIEW: 'purple',
    APPROVED: 'green',
    REJECTED: 'red',
};

export const VENDOR_STATUS_COLOR: Record<string, string> = {
    NOT_SENT: 'default',
    SENDING: 'blue',
    SENT: 'green',
    FAILED: 'red',
};

export const PAYMENT_STATUS_COLOR: Record<string, string> = {
    PENDING: 'orange',
    COMPLETED: 'green',
    FAILED: 'red',
};

export const ENTITY_TYPE_LABEL: Record<string, string> = {
    proprietorship: 'Proprietorship',
    partnership: 'Partnership',
    opc: 'OPC',
    private_limited: 'Private Limited',
    llp: 'LLP',
};

export const STATUS_OPTIONS = [
    { value: 'PENDING', label: 'Pending (Draft)' },
    { value: 'SUBMITTED', label: 'Submitted' },
    { value: 'UNDER_REVIEW', label: 'Under Review' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' },
];

export const ENTITY_TYPE_OPTIONS = Object.entries(ENTITY_TYPE_LABEL).map(([value, label]) => ({
    value,
    label,
}));

export const PAYMENT_STATUS_OPTIONS = [
    { value: 'PENDING', label: 'Payment Pending' },
    { value: 'COMPLETED', label: 'Paid' },
    { value: 'FAILED', label: 'Payment Failed' },
];
