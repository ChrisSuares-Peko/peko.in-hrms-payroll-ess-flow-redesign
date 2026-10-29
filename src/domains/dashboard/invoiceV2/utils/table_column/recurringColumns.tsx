import { EyeOutlined, PauseCircleOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { Button, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

import type {
    RecurringEndCondition,
    RecurringFrequency,
    RecurringScheduleApiData,
    RecurringScheduleStatus,
} from '../../types/recurring';

const FREQUENCY_UNIT_LABELS: Record<string, string> = {
    DAYS: 'day',
    WEEKS: 'week',
    MONTHS: 'month',
    QUARTERS: 'quarter',
    YEARS: 'year',
};

const frequencyLabel = ({ unit, every }: RecurringFrequency): string => {
    const unitLabel = FREQUENCY_UNIT_LABELS[unit] ?? unit.toLowerCase();
    return every === 1 ? `Every ${unitLabel}` : `Every ${every} ${unitLabel}s`;
};

const endConditionLabel = (cond: RecurringEndCondition): string => {
    if (cond.type === 'FOREVER') return 'Forever';
    if (cond.type === 'AFTER') return `After ${cond.runs} run${cond.runs === 1 ? '' : 's'}`;
    if (cond.type === 'ON' && cond.date) return `Until ${dayjs(cond.date).format('DD MMM YYYY')}`;
    return '—';
};

const STATUS_CONFIG: Record<RecurringScheduleStatus, { bg: string; color: string; label: string }> =
    {
        ACTIVE: { bg: '#ECFDF5', color: '#059669', label: 'Active' },
        PAUSED: { bg: '#FFFBEB', color: '#D97706', label: 'Paused' },
        ENDED: { bg: '#F3F4F6', color: '#6B7280', label: 'Ended' },
    };

const RecurringStatusBadge = ({ status }: { status: RecurringScheduleStatus }) => {
    const cfg = STATUS_CONFIG[status] ?? { bg: '#F3F4F6', color: '#6B7280', label: status };
    return (
        <Tag
            className="!rounded-full !border-0 !text-xs !font-medium !px-3 !py-0.5"
            style={{ backgroundColor: cfg.bg, color: cfg.color }}
        >
            {cfg.label}
        </Tag>
    );
};

type ActionHandlers = {
    onView: (id: string) => void;
    onPause?: (id: string) => void;
    onResume?: (id: string) => void;
    isToggling?: boolean;
};

export const buildRecurringColumns = ({
    onView,
    onPause,
    onResume,
    isToggling = false,
}: ActionHandlers): ColumnsType<RecurringScheduleApiData> => [
    {
        title: 'Created',
        key: 'createdAt',
        render: (_v, r) =>
            r.createdAt ? (
                <div>
                    <div className="text-sm text-gray-700">
                        {dayjs(r.createdAt).format('DD MMM YYYY')}
                    </div>
                    <div className="text-xs text-gray-400">
                        {dayjs(r.createdAt).format('hh:mm A')}
                    </div>
                </div>
            ) : (
                <span className="text-sm text-gray-400">—</span>
            ),
    },
    {
        title: 'Schedule',
        key: 'scheduleName',
        render: (_v, r) => (
            <div>
                <div className="text-sm font-semibold text-gray-900">{r.scheduleName}</div>
                <div className="text-xs text-gray-500 mt-0.5">
                    {endConditionLabel(r.endCondition)}
                </div>
            </div>
        ),
    },
    {
        title: 'Frequency',
        key: 'frequency',
        render: (_v, r) => (
            <span className="text-sm text-gray-700">{frequencyLabel(r.frequency)}</span>
        ),
    },
    {
        title: 'Amount',
        key: 'amount',
        render: (_v, r) => {
            const total = parseFloat(r.sourceInvoice?.totalAmount || '0');
            if (total > 0) {
                return (
                    <span className="text-sm font-medium text-gray-900">
                        ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                );
            }
            return <span className="text-sm text-gray-400">—</span>;
        },
    },
    {
        title: 'Progress',
        key: 'progress',
        render: (_v, r) => (
            <div>
                <div className="text-sm text-gray-700">
                    {r.completedRuns} run{r.completedRuns !== 1 ? 's' : ''}
                </div>
                {r.endCondition.type === 'AFTER' && (
                    <div className="text-xs text-gray-400">of {r.endCondition.runs}</div>
                )}
            </div>
        ),
    },
    {
        title: 'Next run',
        key: 'nextRunDate',
        render: (_v, r) =>
            r.nextRunDate ? (
                <div>
                    <div className="text-sm text-gray-700">
                        {dayjs(r.nextRunDate).format('DD MMM YYYY')}
                    </div>
                    <div className="text-xs text-gray-400">
                        {dayjs(r.nextRunDate).format('dddd')}
                    </div>
                </div>
            ) : (
                <span className="text-sm text-gray-400">—</span>
            ),
    },
    {
        title: 'Status',
        key: 'status',
        render: (_v, r) => <RecurringStatusBadge status={r.status} />,
    },
    {
        title: 'Actions',
        key: 'actions',
        width: 100,
        render: (_v, r) => (
            <div className="flex items-center gap-1">
                <Tooltip title={r.status === 'ACTIVE' ? 'Pause' : 'Resume'}>
                    <Button
                        size="small"
                        type="text"
                        disabled={isToggling || r.status === 'ENDED'}
                        icon={
                            r.status === 'ACTIVE' ? <PauseCircleOutlined /> : <PlayCircleOutlined />
                        }
                        onClick={() =>
                            r.status === 'ACTIVE' ? onPause?.(r.id) : onResume?.(r.id)
                        }
                    />
                </Tooltip>
                <Tooltip title="View">
                    <Button
                        size="small"
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={() => onView(r.id)}
                    />
                </Tooltip>
            </div>
        ),
    },
];
