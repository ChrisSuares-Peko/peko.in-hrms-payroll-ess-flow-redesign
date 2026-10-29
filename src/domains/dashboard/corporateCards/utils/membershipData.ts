import { MembershipStage } from '../hooks/user/useMembershipRequest';

export const REQUEST_ACCESS_INTRO = {
    badge: 'Corporate Cards',
    title: 'Get a card for your company spending',
    description:
        "You don't have a corporate card yet. Ask your admin to issue you one - once they do, you'll see it here along with your spends and transaction history.",
    footnote: 'Your admin issues and funds the card. You just request it.',
    ctaLabel: 'Request Access',
};

export type RequestAccessMedia = 'card' | 'tracking' | 'funding';

export interface RequestAccessFeature {
    key: string;
    title: string;
    description: string;
    media: RequestAccessMedia;
}

export const REQUEST_ACCESS_FEATURES: RequestAccessFeature[] = [
    {
        key: 'cards',
        title: 'Virtual & Physical Cards',
        description: 'Get an instant virtual card for online spends, or RuPay physical card.',
        media: 'card',
    },
    {
        key: 'tracking',
        title: 'Real-Time Tracking',
        description: 'See every transaction and receipt on your card the moment it happens.',
        media: 'tracking',
    },
    {
        key: 'funded',
        title: 'Funded by Your Company',
        description: "No out-of-pocket spending - your card draws from your company's wallet.",
        media: 'funding',
    },
];

export const REQUEST_ACCESS_TRACKING_ART = {
    heading: 'Spending',
    rangeLabel: 'Last Week',
    amount: '\u20B9 22,000',
    deltaLabel: '13%',
    deltaNote: '+7k compared with last month',
    gridLines: ['4000', '3000', '2000', '1000', '0'],
    bars: [
        { key: 'mon', label: 'Mon', height: 85 },
        { key: 'tue', label: 'Tue', height: 57 },
        { key: 'wed', label: 'Wed', height: 85 },
        { key: 'thu', label: 'Thu', height: 73 },
        { key: 'fri', label: 'Fri', height: 58 },
        { key: 'sat', label: 'Sat', height: 85 },
        { key: 'sun', label: 'Sun', height: 100 },
    ],
};

export const REQUEST_ACCESS_FUNDING_ART = {
    heading: 'Add Fund',
    amount: '\u20B9 18,000',
    ctaLabel: 'Add fund now',
};

export type StatusTone = 'success' | 'error' | 'warning';

export interface MembershipStatusCopy {
    tone: StatusTone;
    title: string;
    description: string;
    statusLabel: string;
    ctaLabel?: string;
}

export const MEMBERSHIP_STATUS_COPY: Record<
    Exclude<MembershipStage, 'request'>,
    MembershipStatusCopy
> = {
    submitted: {
        tone: 'success',
        title: 'Request for Access Submitted',
        description:
            'Your request has been sent to your company admin. You will be notified by email as soon as it is reviewed.',
        statusLabel: 'Submitted',
    },
    pending: {
        tone: 'warning',
        title: 'Request for Access Pending',
        description:
            'Your request is waiting for your company admin to review it. You will be notified by email once a decision is made.',
        statusLabel: 'Pending',
    },
    approved: {
        tone: 'success',
        title: 'Request for Access Approved',
        description:
            'Congratulations! Your corporate card request has been approved. Complete your KYC to get your card.',
        statusLabel: 'Approved',
        ctaLabel: 'Initiate KYC',
    },
    rejected: {
        tone: 'error',
        title: 'Request for Access Rejected',
        description:
            "We're sorry to inform you that your corporate card request has been rejected. If you have any questions or need further assistance, please reach out to our support team.",
        statusLabel: 'Rejected',
        ctaLabel: 'Resubmit Request',
    },
};

export const STATUS_FIELD_LABELS = {
    status: 'Request Status',
    requestId: 'Request ID',
    requestedOn: 'Requested On',
    reason: 'Reason:',
};
