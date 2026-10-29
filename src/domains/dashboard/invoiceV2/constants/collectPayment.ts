import linkIcon from '../assets/icons/collectPayment/link.svg';
// import mobileIcon from '../assets/icons/collectPayment/mobile.svg';
import repeateMusicIcon from '../assets/icons/collectPayment/repeate-music.svg';
import { CollectPaymentStep } from '../types/CollectPayment';

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

export const COLLECT_PAYMENT_SUCCESS_STEPS: CollectPaymentStep[] = [
    'payment-link-created',
    'payment-received',
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
