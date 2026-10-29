import { Typography } from 'antd';

import { RestaurantStatus } from '../../types';

export type BadgeTone = 'success' | 'warning' | 'danger' | 'neutral';

const TONE_CLASS: Record<BadgeTone, { wrap: string; dot: string; text: string }> = {
    success: {
        wrap: 'bg-emerald-50 border-emerald-500',
        dot: 'bg-emerald-500',
        text: 'text-emerald-700',
    },
    warning: {
        wrap: 'bg-amber-50 border-amber-400',
        dot: 'bg-amber-400',
        text: 'text-amber-700',
    },
    danger: {
        wrap: 'bg-red-50 border-red-400',
        dot: 'bg-red-500',
        text: 'text-red-700',
    },
    neutral: {
        wrap: 'bg-neutral-100 border-zinc-300',
        dot: 'bg-zinc-400',
        text: 'text-zinc-600',
    },
};

const STATUS_PRESET: Record<RestaurantStatus, { label: string; tone: BadgeTone }> = {
    active: { label: 'Active', tone: 'success' },
    pending: { label: 'Awaiting approval', tone: 'warning' },
    suspended: { label: 'Suspended', tone: 'danger' },
    rejected: { label: 'Rejected', tone: 'danger' },
};

type StatusBadgeProps = {
    status?: RestaurantStatus;
    label?: string;
    tone?: BadgeTone;
};

const StatusBadge = ({ status, label, tone }: StatusBadgeProps) => {
    const preset = status ? STATUS_PRESET[status] : undefined;
    const resolvedLabel = label ?? preset?.label ?? 'Setting up';
    const resolvedTone = tone ?? preset?.tone ?? 'neutral';
    const classes = TONE_CLASS[resolvedTone];

    return (
        <div
            className={`inline-flex items-center gap-1 px-2 py-0.5 border rounded-full ${classes.wrap}`}
        >
            <span className={`w-1.5 h-1.5 rounded-full ${classes.dot}`} />
            <Typography.Text className={`text-xs font-medium leading-none ${classes.text}`}>
                {resolvedLabel}
            </Typography.Text>
        </div>
    );
};

export default StatusBadge;
