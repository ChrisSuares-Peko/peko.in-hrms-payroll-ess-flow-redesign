import bankIcon from '../assets/icons/collectPayment/bank.svg';
import linkIcon from '../assets/icons/collectPayment/link.svg';
// import mobileIcon from '../assets/icons/collectPayment/mobile.svg';
import moneyTickIcon from '../assets/icons/collectPayment/money-tick.svg';
// import repeateMusicIcon from '../assets/icons/collectPayment/repeate-music.svg';
import globalIcon from '../assets/icons/global.svg';
import { PaymentMethod } from '../types/documentDetails';
import { DocumentType } from '../types/documents';

export const DOMESTIC_METHODS: PaymentMethod[] = [
    { key: 'payment-link', label: 'Create Payment Link', iconBg: 'bg-red-50', icon: linkIcon },
    // {
    //     key: 'upi',
    //     label: 'Send UPI Collect',
    //     iconBg: 'bg-indigo-50',
    //     icon: mobileIcon,
    //     // disabled: true,
    // },
    { key: 'bank', label: 'Bank Transfer', iconBg: 'bg-amber-50', icon: bankIcon },
    // {
    //     key: 'enach',
    //     label: 'eNACH Mandate',
    //     iconBg: 'bg-green-50',
    //     icon: repeateMusicIcon,
    //     // disabled: true,
    // },
];

export const INTERNATIONAL_METHODS: PaymentMethod[] = [
    {
        key: 'virtual-iban',
        label: 'Virtual IBAN',
        iconBg: 'bg-red-50',
        icon: globalIcon,
        disabled: true,
    },
    {
        key: 'currency-account',
        label: 'Currency Account',
        iconBg: 'bg-indigo-50',
        icon: moneyTickIcon,
        disabled: true,
    },
];

export const TIMELINE_CONFIG: Record<
    DocumentType,
    { title: string; steps: [string, string, string]; finalStep: (status?: string) => string }
> = {
    INVOICE: {
        title: 'Payment Timeline',
        steps: ['Invoice Added', 'Payment Pending', 'Paid'],
        finalStep: status => (status === 'PAID' ? 'Paid' : 'Not Paid'),
    },
    SALES_ORDER: {
        title: 'Sales Order Timeline',
        steps: ['Order Created', 'Processing', 'Completed'],
        finalStep: status => (status === 'COMPLETED' ? 'Completed' : 'Completed'),
    },
    QUOTATION: {
        title: 'Quotation Timeline',
        steps: ['Quote Sent', 'Under Review', 'Approved'],
        finalStep: status => (status === 'ACCEPTED' ? 'Approved' : 'Approved'),
    },
};

export const FINAL_STATUSES: Record<DocumentType, string> = {
    INVOICE: 'PAID',
    SALES_ORDER: 'COMPLETED',
    QUOTATION: 'ACCEPTED',
};