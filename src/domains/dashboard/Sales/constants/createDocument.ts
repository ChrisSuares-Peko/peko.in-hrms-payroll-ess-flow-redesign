import { DocumentType } from '../types/documents';

export const DOC_CONFIG: Record<
    DocumentType,
    {
        title: string;
        sectionTitle: string;
        numberLabel: string;
        numberPlaceholder: string;
        submitLabel: string;
        updateLabel: string;
    }
> = {
    INVOICE: {
        title: 'Invoice',
        sectionTitle: 'Invoice Details',
        numberLabel: 'Invoice Number',
        numberPlaceholder: 'Enter Invoice Number',
        submitLabel: 'Generate Invoice',
        updateLabel: 'Update Invoice',
    },
    SALES_ORDER: {
        title: 'Sales Order',
        sectionTitle: 'Order Details',
        numberLabel: 'Order Number',
        numberPlaceholder: 'Enter Order Number',
        submitLabel: 'Create Sales Order',
        updateLabel: 'Update Sales Order',
    },
    QUOTATION: {
        title: 'Quotation',
        sectionTitle: 'Quotation Details',
        numberLabel: 'Quotation Number',
        numberPlaceholder: 'Enter Quotation Number',
        submitLabel: 'Create Quotation',
        updateLabel: 'Update Quotation',
    },
};

export const COUNTRY_OPTIONS = [
    { value: 'Australia', label: 'Australia' },
    { value: 'Bangladesh', label: 'Bangladesh' },
    { value: 'Brazil', label: 'Brazil' },
    { value: 'Canada', label: 'Canada' },
    { value: 'China', label: 'China' },
    { value: 'Denmark', label: 'Denmark' },
    { value: 'France', label: 'France' },
    { value: 'Germany', label: 'Germany' },
    { value: 'Hong Kong', label: 'Hong Kong' },
    { value: 'Indonesia', label: 'Indonesia' },
    { value: 'Italy', label: 'Italy' },
    { value: 'Japan', label: 'Japan' },
    { value: 'Malaysia', label: 'Malaysia' },
    { value: 'Mexico', label: 'Mexico' },
    { value: 'Nepal', label: 'Nepal' },
    { value: 'Netherlands', label: 'Netherlands' },
    { value: 'New Zealand', label: 'New Zealand' },
    { value: 'Norway', label: 'Norway' },
    { value: 'Saudi Arabia', label: 'Saudi Arabia' },
    { value: 'Singapore', label: 'Singapore' },
    { value: 'South Africa', label: 'South Africa' },
    { value: 'South Korea', label: 'South Korea' },
    { value: 'Spain', label: 'Spain' },
    { value: 'Sri Lanka', label: 'Sri Lanka' },
    { value: 'Sweden', label: 'Sweden' },
    { value: 'Switzerland', label: 'Switzerland' },
    { value: 'Thailand', label: 'Thailand' },
    { value: 'United Arab Emirates', label: 'United Arab Emirates' },
    { value: 'United Kingdom', label: 'United Kingdom' },
    { value: 'United States', label: 'United States' },
];

export const CURRENCY_OPTIONS = [
    { value: 'INR', label: 'INR — Indian Rupee' },
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'AED', label: 'AED - UAE Dirham' },
    { value: 'SAR', label: 'SAR - Saudi Riyal' },
    { value: 'SGD', label: 'SGD - Singapore Dollar' },
    { value: 'AUD', label: 'AUD - Australian Dollar' },
    { value: 'CAD', label: 'CAD - Canadian Dollar' },
    { value: 'JPY', label: 'JPY - Japanese Yen' },
    { value: 'CNY', label: 'CNY - Chinese Yuan' },
    { value: 'CHF', label: 'CHF - Swiss Franc' },
    { value: 'HKD', label: 'HKD - Hong Kong Dollar' },
    { value: 'MYR', label: 'MYR - Malaysian Ringgit' },
    { value: 'THB', label: 'THB - Thai Baht' },
    { value: 'KRW', label: 'KRW - South Korean Won' },
    { value: 'BDT', label: 'BDT - Bangladeshi Taka' },
    { value: 'LKR', label: 'LKR - Sri Lankan Rupee' },
    { value: 'NPR', label: 'NPR - Nepalese Rupee' },
    { value: 'ZAR', label: 'ZAR - South African Rand' },
    { value: 'BRL', label: 'BRL - Brazilian Real' },
];

export const UNIT_OPTIONS = [
    { value: 'pcs', label: 'Pcs' },
    { value: 'kg', label: 'Kg' },
    { value: 'ltr', label: 'Ltr' },
    { value: 'nos', label: 'Nos' },
    { value: 'mtr', label: 'Mtr' },
    { value: 'box', label: 'Box' },
    { value: 'set', label: 'Set' },
    { value: 'hr', label: 'Hr' },
    { value: 'non', label: 'Non' },
];

export const DECIMAL_QUANTITY_UNITS = ['kg', 'ltr', 'mtr', 'hr'];

export const GST_OPTIONS = [
    { value: '0', label: 'GST 0%' },
    { value: '5', label: 'GST 5%' },
    { value: '12', label: 'GST 12%' },
    { value: '18', label: 'GST 18%' },
    { value: '28', label: 'GST 28%' },
];

export const GST_MODE_OPTIONS = [
    { value: 'Exclusive', label: 'Exclusive (GST added on top)' },
    { value: 'Inclusive', label: 'Inclusive (GST included in price)' },
];
