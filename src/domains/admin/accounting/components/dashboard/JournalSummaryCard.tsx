import { ArrowRightOutlined, BookOutlined, CheckCircleFilled } from '@ant-design/icons';
import { Card, Flex, Tooltip, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import { faqHint } from '../../faq/FaqHint';
import { STATUS_COLORS } from '../../utils/dashboardCharts';
import {
    AccountingJournalSummary,
    AccountingKpi,
    JournalCounts,
    JournalHealthTone,
} from '../../utils/dashboardData';

type JournalSummaryCardProps = {
    journal: AccountingJournalSummary;
    scope: string;
};

const RING_SIZE = 116;
const RING_STROKE = 11;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;
const TRACK_COLOR = '#EEF1F5';

const HEALTH_PILL: Record<JournalHealthTone, string> = {
    success: 'bg-green-50 text-green-700',
    warning: 'bg-bgLightYellow text-amber-700',
    error: 'bg-bgLightRed text-red-700',
    neutral: 'bg-gray-100 text-textBody',
};

const STATES: { key: keyof JournalCounts; label: string }[] = [
    { key: 'recorded', label: 'recorded' },
    { key: 'failed', label: 'failed' },
    { key: 'skipped', label: 'skipped' },
    { key: 'notRecorded', label: 'not recorded' },
];

const ATTENTION_STYLE: Record<string, { box: string; value: string; dot: string }> = {
    danger: {
        box: 'bg-bgLightRed border-red-200 hover:border-red-300',
        value: 'text-red-600',
        dot: STATUS_COLORS.failed,
    },
    warning: {
        box: 'bg-bgLightYellow border-amber-200 hover:border-amber-300',
        value: 'text-amber-600',
        dot: STATUS_COLORS.skipped,
    },
};

const countText = (value: number) => formatNumberWithLocalString(value, 0, 0);

const HealthRing = ({
    counts,
    attempted,
    percent,
}: {
    counts: JournalCounts;
    attempted: number;
    percent: number | null;
}) => {
    const parts = STATES.filter(state => counts[state.key] > 0);
    const summary = attempted
        ? parts.map(state => `${countText(counts[state.key])} ${state.label}`).join(', ')
        : 'no entries yet';
    let offset = 0;

    return (
        <Tooltip title={`Entries tried: ${summary}`}>
            <div
                role="img"
                aria-label={`Journal entries: ${summary}`}
                className="relative shrink-0"
                style={{ width: RING_SIZE, height: RING_SIZE }}
            >
                <svg
                    width={RING_SIZE}
                    height={RING_SIZE}
                    viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
                    className="-rotate-90"
                    aria-hidden
                >
                    <circle
                        cx={RING_SIZE / 2}
                        cy={RING_SIZE / 2}
                        r={RING_RADIUS}
                        fill="none"
                        stroke={TRACK_COLOR}
                        strokeWidth={RING_STROKE}
                    />
                    {attempted > 0 &&
                        parts.map(state => {
                            const length = (counts[state.key] / attempted) * RING_LENGTH;
                            const arc = (
                                <circle
                                    key={state.key}
                                    cx={RING_SIZE / 2}
                                    cy={RING_SIZE / 2}
                                    r={RING_RADIUS}
                                    fill="none"
                                    stroke={STATUS_COLORS[state.key]}
                                    strokeWidth={RING_STROKE}
                                    strokeDasharray={`${length} ${RING_LENGTH - length}`}
                                    strokeDashoffset={-offset}
                                />
                            );
                            offset += length;
                            return arc;
                        })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[22px] font-semibold leading-none text-textHeadings">
                        {percent === null ? '—' : `${percent}%`}
                    </span>
                    <span className="mt-1 text-[10px] uppercase tracking-wide text-textBody">
                        in the books
                    </span>
                </div>
            </div>
        </Tooltip>
    );
};

const KindTile = ({ kpi, onOpen }: { kpi: AccountingKpi; onOpen: (to?: string) => void }) => {
    const zero = kpi.value === '0';
    return (
        <div className="relative min-w-0">
            <button
                type="button"
                aria-label={`${kpi.title}, ${kpi.value}`}
                disabled={!kpi.to}
                onClick={() => onOpen(kpi.to)}
                className="block w-full appearance-none rounded-lg border border-solid border-borderCard bg-white px-3 py-2.5 text-left transition-colors enabled:cursor-pointer enabled:hover:border-red-200 enabled:hover:bg-bgIconCard"
            >
                <span className="block truncate pr-4 text-xs text-textBody">
                    {kpi.shortTitle ?? kpi.title}
                </span>
                <span
                    className={`block text-lg leading-tight ${
                        zero ? 'font-medium text-[#A9B4C2]' : 'font-semibold text-textHeadings'
                    }`}
                >
                    {kpi.value}
                </span>
            </button>
            <span className="absolute right-2 top-2">
                {faqHint('Dashboard', 'KPIs', kpi.title)}
            </span>
        </div>
    );
};

const AttentionTile = ({ kpi, onOpen }: { kpi: AccountingKpi; onOpen: (to?: string) => void }) => {
    const style = ATTENTION_STYLE[kpi.tone === 'danger' ? 'danger' : 'warning'];
    return (
        <div className="relative min-w-0">
            <button
                type="button"
                disabled={!kpi.to}
                onClick={() => onOpen(kpi.to)}
                className={`block w-full appearance-none rounded-lg border border-solid px-3 py-2.5 text-left transition-colors enabled:cursor-pointer ${style.box}`}
            >
                <Flex align="center" gap={6} className="pr-4">
                    <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: style.dot }}
                        aria-hidden
                    />
                    <span className="truncate text-xs text-textHeadings">{kpi.title}</span>
                </Flex>
                <Flex align="baseline" justify="space-between" gap={8}>
                    <span className={`text-xl font-semibold leading-tight ${style.value}`}>
                        {kpi.value}
                    </span>
                    {kpi.action && kpi.to && (
                        <span className={`text-xs font-semibold ${style.value}`}>
                            {kpi.action} <ArrowRightOutlined className="text-[10px]" />
                        </span>
                    )}
                </Flex>
            </button>
            <span className="absolute right-2 top-2">
                {faqHint('Dashboard', 'KPIs', kpi.title)}
            </span>
        </div>
    );
};

const SectionLabel = ({ children }: { children: string }) => (
    <Typography.Text className="text-[11px] font-semibold uppercase tracking-wide text-textBody">
        {children}
    </Typography.Text>
);

const JournalSummaryCard = ({ journal, scope }: JournalSummaryCardProps) => {
    const navigate = useNavigate();
    const open = (to?: string) => {
        if (to) navigate(to);
    };
    const { counts, attempted, health, total, attention } = journal;
    const legend = STATES.filter(state => counts[state.key] > 0);

    return (
        <Card
            className="w-full border border-borderCard shadow-none rounded-xl"
            styles={{ body: { padding: 0 } }}
        >
            <Flex
                align="center"
                gap={12}
                wrap="wrap"
                className="px-5 py-4 border-b border-borderCard"
            >
                <Flex
                    align="center"
                    justify="center"
                    className="h-9 w-9 shrink-0 rounded-lg bg-bgIconCard text-base text-textHeadings"
                >
                    <BookOutlined />
                </Flex>
                <Flex vertical className="min-w-0">
                    <Typography.Text className="text-[15px] font-semibold text-textHeadings">
                        Journals
                    </Typography.Text>
                    <Typography.Text className="text-xs text-textBody">
                        Accounting entries for {scope}
                    </Typography.Text>
                </Flex>
                <Flex align="center" gap={12} className="ml-auto">
                    <span
                        className={`inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold ${HEALTH_PILL[health.tone]}`}
                    >
                        {health.label}
                    </span>
                    {total.to && (
                        <Typography.Link
                            className="text-xs font-semibold whitespace-nowrap"
                            onClick={() => open(total.to)}
                        >
                            Open order journals <ArrowRightOutlined className="text-[10px]" />
                        </Typography.Link>
                    )}
                </Flex>
            </Flex>
            <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,290px)_minmax(0,1fr)]">
                <Flex vertical gap={14} className="rounded-xl bg-bgGray p-4">
                    <Flex align="center" gap={16}>
                        <HealthRing
                            counts={counts}
                            attempted={attempted}
                            percent={health.percent}
                        />
                        <Flex vertical className="min-w-0">
                            <Typography.Text className="text-[13px] text-textBody">
                                {total.title}
                                {faqHint('Dashboard', 'KPIs', total.title)}
                            </Typography.Text>
                            <Typography.Text className="text-[32px] font-semibold leading-none text-textHeadings">
                                {total.value}
                            </Typography.Text>
                            <Typography.Text className="mt-1.5 text-xs text-textBody">
                                {attempted
                                    ? `of ${countText(attempted)} tried, in the books`
                                    : 'nothing tried yet'}
                            </Typography.Text>
                        </Flex>
                    </Flex>
                    {legend.length > 0 && (
                        <Flex gap={6} wrap="wrap">
                            {legend.map(state => (
                                <span
                                    key={state.key}
                                    className="inline-flex h-6 items-center gap-1.5 rounded-full bg-white px-2.5 text-xs text-textHeadings"
                                >
                                    <span
                                        className="h-2 w-2 rounded-full"
                                        style={{ background: STATUS_COLORS[state.key] }}
                                        aria-hidden
                                    />
                                    {`${countText(counts[state.key])} ${state.label}`}
                                </span>
                            ))}
                        </Flex>
                    )}
                </Flex>
                <Flex vertical gap={16} className="min-w-0">
                    <Flex vertical gap={8}>
                        <SectionLabel>By entry kind</SectionLabel>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
                            {journal.kinds.map(kpi => (
                                <KindTile key={kpi.key} kpi={kpi} onOpen={open} />
                            ))}
                        </div>
                    </Flex>
                    <Flex vertical gap={8}>
                        <SectionLabel>Needs attention</SectionLabel>
                        {attention.length ? (
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                                {attention.map(kpi => (
                                    <AttentionTile key={kpi.key} kpi={kpi} onOpen={open} />
                                ))}
                            </div>
                        ) : (
                            <Flex
                                align="center"
                                gap={10}
                                className="rounded-lg border border-solid border-green-200 bg-green-50 px-3 py-2.5"
                            >
                                <CheckCircleFilled className="text-base text-green-600" />
                                <Flex vertical className="min-w-0">
                                    <Typography.Text className="text-[13px] font-semibold text-green-800">
                                        Nothing needs attention
                                    </Typography.Text>
                                    <Typography.Text className="text-xs text-green-700">
                                        {attempted
                                            ? `Every entry tried for ${scope} reached the books.`
                                            : `No entries have been tried for ${scope} yet.`}
                                    </Typography.Text>
                                </Flex>
                            </Flex>
                        )}
                    </Flex>
                </Flex>
            </div>
        </Card>
    );
};

export default JournalSummaryCard;
