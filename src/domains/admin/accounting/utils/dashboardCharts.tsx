import { ReactNode } from 'react';

import {
    CheckCircleFilled,
    CloseCircleFilled,
    FileUnknownOutlined,
    MinusCircleFilled,
} from '@ant-design/icons';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import { DEFAULT_PARTNER_LABEL } from './approvals';
import { formatInr } from './commission';
import { plural } from './text';
import {
    DashboardMetricKey,
    DashboardRankingKey,
    DashboardRankingRow,
    DashboardSection,
} from '../types/dashboard';

export const CHART_CARD_TITLES = ['Journal Health', 'Revenue Mix', 'Top Performers'] as const;

export const CHART_CAPTION = 'Month to date';

export const STATUS_COLORS = {
    recorded: '#43B75D',
    failed: '#DC2626',
    skipped: '#F59E0B',
    notRecorded: '#94A3B8',
} as const;

export const SERIES_COLOR = '#2a78d6';

export const PLACEHOLDER_COLOR = '#E6EAF0';

export type JournalHealthKey = keyof typeof STATUS_COLORS;

export type JournalHealthSegment = {
    key: JournalHealthKey;
    label: string;
    value: number;
    color: string;
    icon: ReactNode;
};

export type RankRow = {
    key: string;
    label: string;
    value: number;
    display: string;
    sub?: string;
    pct: number;
};

const JOURNAL_HEALTH_STATES: {
    key: JournalHealthKey;
    label: string;
    metricKey: DashboardMetricKey;
    icon: ReactNode;
}[] = [
    {
        key: 'recorded',
        label: 'Recorded',
        metricKey: 'journalEntries',
        icon: <CheckCircleFilled />,
    },
    { key: 'failed', label: 'Failed', metricKey: 'failedEntries', icon: <CloseCircleFilled /> },
    { key: 'skipped', label: 'Skipped', metricKey: 'skippedEntries', icon: <MinusCircleFilled /> },
    {
        key: 'notRecorded',
        label: 'Not recorded',
        metricKey: 'notRecordedEntries',
        icon: <FileUnknownOutlined />,
    },
];

const REVENUE_MIX_LINES: { key: string; label: string; metricKey: DashboardMetricKey }[] = [
    { key: 'commission', label: 'Commission', metricKey: 'commission' },
    { key: 'platformFee', label: 'Platform fee', metricKey: 'platformFee' },
    { key: 'subscriptions', label: 'Subscription income', metricKey: 'subscriptions' },
    { key: 'otherSales', label: 'Sales as principal', metricKey: 'otherSales' },
];

export const RANKING_VIEWS: { key: DashboardRankingKey; label: string; basis: string }[] = [
    {
        key: 'services',
        label: 'Services',
        basis: 'Ranked by full order value on successful orders',
    },
    { key: 'vendors', label: 'Vendors', basis: 'Ranked by commission excluding GST' },
    {
        key: 'partners',
        label: 'Partners',
        basis: 'Ranked by full order value on successful orders',
    },
];

const metric = (section: DashboardSection | undefined, key: DashboardMetricKey) =>
    Number(section?.[key]) || 0;

const pctOf = (value: number, max: number) => (max > 0 ? Math.round((value / max) * 100) : 0);

const countText = (value: number) => formatNumberWithLocalString(value, 0, 0);

export const buildJournalHealth = (section?: DashboardSection) => {
    const segments: JournalHealthSegment[] = JOURNAL_HEALTH_STATES.map(state => ({
        key: state.key,
        label: state.label,
        value: metric(section, state.metricKey),
        color: STATUS_COLORS[state.key],
        icon: state.icon,
    }));
    const total = segments.reduce((sum, segment) => sum + segment.value, 0);

    return { segments, total, empty: total <= 0 };
};

export const buildRevenueMix = (section?: DashboardSection): RankRow[] => {
    const values = REVENUE_MIX_LINES.map(line => metric(section, line.metricKey));
    const max = Math.max(...values);

    return REVENUE_MIX_LINES.map((line, index) => ({
        key: line.key,
        label: line.label,
        value: values[index],
        display: formatInr(values[index]),
        pct: pctOf(values[index], max),
    }));
};

export const buildRankingRows = (rows?: DashboardRankingRow[] | null): RankRow[] => {
    if (!rows || !rows.length) return [];
    const max = Math.max(...rows.map(row => Number(row.amount) || 0));

    return rows.map(row => {
        const amount = Number(row.amount) || 0;
        const orders = Number(row.orders) || 0;
        return {
            key: String(row.id ?? 'default'),
            label: row.name ?? DEFAULT_PARTNER_LABEL,
            value: amount,
            display: formatInr(amount),
            sub: `${countText(orders)} ${plural(orders, 'order', 'orders')}`,
            pct: pctOf(amount, max),
        };
    });
};
