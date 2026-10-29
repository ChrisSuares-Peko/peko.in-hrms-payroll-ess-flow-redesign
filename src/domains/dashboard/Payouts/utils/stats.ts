import moneyIcon from '../assets/icons/moneyIcon.svg';
import payoutStatusIcon from '../assets/icons/payoutStatus.svg';
import walletIcon from '../assets/icons/walletIcon.svg';

export const statusColorMap: Record<string, string> = {
    Completed: 'success',
    COMPLETED: 'success',
    Failed: 'error',
    FAILED: 'error',
    Pending: 'warning',
    PENDING: 'warning',
    Processing: 'processing',
    PROCESSING: 'processing',
};

export const statusOptions = [
    { label: 'All Status', value: '' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Failed', value: 'FAILED' },
    { label: 'Pending', value: 'PENDING' },
];

export const onboardingSteps = [
    { id: 1, title: 'Activate Service',  description: 'Click the button to enable payouts' },
    { id: 2, title: 'Add Beneficiaries', description: 'Your payout account is configured instantly' },
    { id: 3, title: 'Transfer & Track',  description: 'Send funds and monitor disbursement status' },
];

export const statusCards = [
    {
        key: 'payout-service',
        title: 'Payout Service',
        description: 'Activate to start disbursing funds to beneficiaries',
        status: 'Not Active',
        statusColor: '#FF4D4F',
        statusBg: '#FFF1F0',
        iconType: 'clock' as const,
    },
    {
        key: 'payout-account',
        title: 'Payout Account',
        description: 'A dedicated payout account will be set up upon activation',
        status: 'Pending',
        statusColor: '#F79009',
        statusBg: '#FFFAEB',
        iconType: 'clock' as const,
    },
    {
        key: 'transfer-gateway',
        title: 'Transfer Gateway',
        description: 'Transfer gateway unlocks after payout service is activated',
        status: 'Not Active',
        statusColor: '#FF4D4F',
        statusBg: '#FFF1F0',
        iconType: 'lock' as const,
    },
];

export const statDefinitions = [
    {
        key: 'total-payout',
        label: 'Total Payouts This Month',
        bgColor: '#FDF6F0',
        value: '₹4,67,33.00',
        icon: payoutStatusIcon,
        prefix: '₹',
        iconColor: '#000000',
    },
    {
        key: 'active-beneficiaries',
        label: 'Active Beneficiaries',
        bgColor: '#ECF0FC',
        value: '23',
        icon: walletIcon,
        iconColor: '#000000',
    },
    {
        key: 'va-balance',
        label: 'VA Balance',
        bgColor: '#EBF6F1',
        icon: moneyIcon,
        value: '—',
        prefix: '₹',
        iconColor: '#000000',
    },
];