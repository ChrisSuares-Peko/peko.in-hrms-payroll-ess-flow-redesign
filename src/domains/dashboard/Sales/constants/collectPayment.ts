import linkIcon from '../assets/icons/collectPayment/link.svg';
import repeateMusicIcon from '../assets/icons/collectPayment/repeate-music.svg';
import { CollectPaymentStep } from '../types/CollectPayment';

export const TRANSFER_METHODS = [
    {
        name: 'NEFT',
        description: 'National Electronic Funds Transfer (typically processed in batches)',
    },
    { name: 'RTGS', description: 'Real Time Gross Settlement (instant, minimum ₹2 lakh)' },
    { name: 'IMPS', description: 'Immediate Payment Service (instant, 24x7)' },
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

export const COLLECT_PAYMENT_OPTIONS = [
    {
        id: 'send-link',
        iconBg: 'bg-red-50',
        icon: linkIcon,
        title: 'Send Payment Link',
        description: 'Generate a shareable link and send to customer',
    },
    // {
    //     id: 'upi',
    //     iconBg: 'bg-indigo-50',
    //     icon: mobileIcon,
    //     title: 'UPI Collect',
    //     description: 'Share QR code or UPI VPA for instant collection',
    // },
    {
        id: 'record',
        iconBg: 'bg-green-50',
        icon: repeateMusicIcon,
        title: 'Record Manually',
        description: 'Log an offline or already-received payment',
    },
];

export const COLLECT_PAYMENT_STEP_META: Record<
    CollectPaymentStep,
    { title: string; subtitle: string }
> = {
    options: { title: 'Collect Payment', subtitle: "Choose how you'd like to collect" },
    'send-link': { title: 'Send Payment Link', subtitle: 'Enter details to generate a link' },
    upi: { title: 'UPI Collect', subtitle: 'Share QR or VPA to receive payment' },
    record: { title: 'Record Manually', subtitle: 'Log an offline or received payment' },
    'payment-link-created': {
        title: 'Payment Link Created',
        subtitle: 'Share this link with your customer to collect payment',
    },
    'payment-received': {
        title: 'Payment Received',
        subtitle: 'The payment has been received successfully',
    },
};