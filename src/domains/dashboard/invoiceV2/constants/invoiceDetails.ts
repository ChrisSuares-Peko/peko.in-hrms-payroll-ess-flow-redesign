import bankIcon from '../assets/icons/collectPayment/bank.svg';
import linkIcon from '../assets/icons/collectPayment/link.svg';
// import mobileIcon from '../assets/icons/collectPayment/mobile.svg';
import moneyTickIcon from '../assets/icons/collectPayment/money-tick.svg';
// import repeateMusicIcon from '../assets/icons/collectPayment/repeate-music.svg';
import globalIcon from '../assets/icons/global.svg';
import { PaymentMethod } from '../types/invoiceDetails';

export const DOMESTIC_METHODS: PaymentMethod[] = [
    { key: 'payment-link', label: 'Create Payment Link', iconBg: 'bg-red-50', icon: linkIcon },
    // { key: 'upi', label: 'Send UPI Collect', iconBg: 'bg-indigo-50', icon: mobileIcon, disabled: true },
    { key: 'bank', label: 'Bank Transfer', iconBg: 'bg-amber-50', icon: bankIcon },
    // { key: 'enach', label: 'eNACH Mandate', iconBg: 'bg-green-50', icon: repeateMusicIcon },
];


export const TRANSFER_METHODS = [
    { name: 'NEFT', description: 'National Electronic Funds Transfer (typically processed in batches)' },
    { name: 'RTGS', description: 'Real Time Gross Settlement (instant, minimum ₹2 lakh)' },
    { name: 'IMPS', description: 'Immediate Payment Service (instant, 24x7)' },
];

export const INTERNATIONAL_METHODS: PaymentMethod[] = [
    { key: 'virtual-iban', label: 'Virtual IBAN', iconBg: 'bg-red-50', icon: globalIcon, disabled: true },
    {
        key: 'currency-account',
        label: 'Currency Account',
        iconBg: 'bg-indigo-50',
        icon: moneyTickIcon,
        disabled: true,
    },
];

export const FREQUENCY_OPTIONS = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
];

export const ENACH_USE_CASES = [
    { title: 'Monthly Services', description: 'Recurring service fees and retainers' },
    { title: 'Subscriptions', description: 'Software, memberships, and plans' },
    { title: 'EMIs', description: 'Equated monthly installment payments' },
];

export const EXPIRY_OPTIONS = [
    { value: '5', label: '5 minutes' },
    { value: '10', label: '10 minutes' },
    { value: '15', label: '15 minutes' },
    { value: '30', label: '30 minutes' },
    { value: '60', label: '1 hour' },
];

export const CURRENCY_ACCOUNT_SETTLEMENT_NOTES = [
    'Payments will be settled to your registered bank account within T+1 business days',
    'Transaction charges apply as per your pricing plan',
    'You will receive email notifications for all successful payments',
];
