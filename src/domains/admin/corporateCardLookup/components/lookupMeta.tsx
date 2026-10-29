import { Tag, Tooltip } from 'antd';

import { formattedDateOnly, formattedTime } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';

type Tone = { color: string; bg: string };

const GREEN: Tone = { color: '#3AB75E', bg: '#ECFDF3' };
const AMBER: Tone = { color: '#D97706', bg: '#FFFBEB' };
const RED: Tone = { color: '#DC2626', bg: '#FEF2F2' };
const BLUE: Tone = { color: '#2563EB', bg: '#EFF6FF' };
const GREY: Tone = { color: '#64748B', bg: '#F1F5F9' };

const TONES: Record<string, Tone> = {
    // Card activation / state
    Activated: GREEN,
    Active: GREEN,
    Pending: AMBER,
    Failed: RED,
    Frozen: BLUE,
    Terminated: GREY,
    Expired: GREY,
    // Delivery
    Delivered: GREEN,
    'In transit': BLUE,
    'Not dispatched': AMBER,
    Ordered: AMBER,
    Issued: GREEN,
    Replaced: GREY,
    // KYC
    COMPLETED: GREEN,
    REJECTED: RED,
    PENDING: AMBER,
    INITIATED: AMBER,
    NOT_STARTED: GREY,
    // Requests
    APPROVED: GREEN,
    PROCESSING: BLUE,
    CANCELLED: GREY,
    // Membership
    ACTIVE: GREEN,
    INVITED: AMBER,
    INACTIVE: GREY,
    REMOVED: GREY,
};

const LABELS: Record<string, string> = {
    COMPLETED: 'Approved',
    REJECTED: 'Rejected',
    PENDING: 'Pending',
    INITIATED: 'Initiated',
    NOT_STARTED: 'Not started',
    APPROVED: 'Approved',
    PROCESSING: 'Processing',
    CANCELLED: 'Cancelled',
    ACTIVE: 'Active',
    INVITED: 'Invited',
    INACTIVE: 'Inactive',
    REMOVED: 'Removed',
};

export const KYC_LABELS: Record<string, string> = {
    COMPLETED: 'Approved',
    REJECTED: 'Rejected',
    PENDING: 'Pending',
    INITIATED: 'Initiated',
    NOT_STARTED: 'Not started',
};

export const REQUEST_TYPE_LABELS: Record<string, string> = {
    CARD_ISSUANCE: 'Card issuance',
    LIMIT_INCREASE: 'Limit increase',
    TOPUP: 'Top-up',
    TERMINATE: 'Termination',
    UNFREEZE: 'Unfreeze',
};

export const toneOf = (status: string | null | undefined): Tone =>
    (status && TONES[status]) || GREY;

// A status pill; with a reason it gets a tooltip so a rejection or failure explains itself in place.
export const StatusPill = ({
    status,
    label,
    reason,
}: {
    status: string | null | undefined;
    label?: string;
    reason?: string | null;
}) => {
    if (!status) return <span>-</span>;
    const tone = toneOf(status);
    const tag = (
        <Tag
            className="m-0 rounded-full border-0 px-2.5 py-0.5 text-xs font-medium"
            style={{ color: tone.color, backgroundColor: tone.bg }}
        >
            {label ?? LABELS[status] ?? status}
        </Tag>
    );
    return reason ? <Tooltip title={reason}>{tag}</Tooltip> : tag;
};

// Non-breaking space: keeps the rupee sign on the same line as the amount on narrow screens.
const NBSP = String.fromCharCode(0xa0);

export const money = (value: number | null | undefined) =>
    value === null || value === undefined
        ? '-'
        : `₹${NBSP}${formatNumberWithLocalString(Number(value))}`;

export const DateCell = ({ value }: { value: string | null | undefined }) => {
    if (!value) return <span>-</span>;
    const date = new Date(value);
    return (
        <div className="flex flex-col">
            <span>{formattedDateOnly(date)}</span>
            <span className="text-xs text-gray-400">{formattedTime(date)}</span>
        </div>
    );
};

export const maskedLast4 = (last4: string | null | undefined) => (last4 ? `•••• ${last4}` : '-');
