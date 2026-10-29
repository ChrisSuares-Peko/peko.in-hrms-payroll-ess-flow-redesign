export const GST_OPTIONS = [
    { value: '0', label: 'GST 0%' },
    { value: '5', label: 'GST 5%' },
    { value: '12', label: 'GST 12%' },
    { value: '18', label: 'GST 18%' },
    { value: '28', label: 'GST 28%' },
];

export const INR_OPTION = [{ value: 'INR', label: 'INR — Indian Rupee' }];

export const PAYMENT_MODE_OPTIONS = [
    { value: 'CASH', label: 'Cash' },
    { value: 'BANK', label: 'Bank Transfer' },
    { value: 'CHEQUE', label: 'Cheque' },
    { value: 'UPI', label: 'UPI' },
    { value: 'PAYMENT_LINK', label: 'Payment Link' },
    { value: 'OTHERS', label: 'Others' },
];

export const IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml'];
export const IMAGE_ACCEPT = '.png,.jpg,.jpeg,.svg';
export const IMAGE_TYPES_LABEL = 'PNG, JPG or SVG';

export const DOCUMENT_TYPE_OPTIONS = [
    { label: 'Invoice', value: 'Invoice' },
    { label: 'Quotation', value: 'Quotation' },
    { label: 'Sales Order', value: 'Sales Order' },
    { label: 'Agreement', value: 'Agreement' },
];

export const buildDefaultNotes = (email: string, phone: string) =>
    [
        'This is a system-generated invoice',
        'Please pay within due date',
        'Thank you for your business!',
        `For queries: ${email || phone || 'contact us'}`,
    ]
        .map(line => `<p>${line}</p>`)
        .join('');

export const buildDefaultTerms = (city: string) =>
    [
        'Payment due within 15 days of invoice date',
        'Late payments may attract interest @18% p.a.',
        'GST charged as applicable; valid GSTIN required for ITC',
        'Goods/services once delivered are non-returnable (unless agreed)',
        'Disputes to be raised within 7 days',
        `Subject to ${city || '[Business City]'} jurisdiction`,
    ]
        .map(line => `<p>${line}</p>`)
        .join('');

export const DEFAULT_DOCUMENT_PREFIXES: Record<string, string> = {
    Invoice: 'INV',
    Quotation: 'QO',
    'Sales Order': 'SO',
    Agreement: 'AGR',
};
