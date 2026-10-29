export const STATUS_COLOR: Record<string, string> = {
    DRAFT: 'default',
    SUBMITTED: 'blue',
    COMPLETED: 'green',
};

export const PAYMENT_STATUS_COLOR: Record<string, string> = {
    PENDING: 'orange',
    COMPLETED: 'green',
    FAILED: 'red',
};

// No review states here — status only ever advances DRAFT (unpaid) -> SUBMITTED (paid) -> COMPLETED (filed with the vendor).
export const STATUS_OPTIONS = [
    { value: 'DRAFT', label: 'Payment Pending' },
    { value: 'SUBMITTED', label: 'Paid — Filing Pending' },
    { value: 'COMPLETED', label: 'Filed' },
];

export const PAYMENT_STATUS_OPTIONS = [
    { value: 'PENDING', label: 'Payment Pending' },
    { value: 'COMPLETED', label: 'Paid' },
    { value: 'FAILED', label: 'Payment Failed' },
];
