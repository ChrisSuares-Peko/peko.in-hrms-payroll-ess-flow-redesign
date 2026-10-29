import { EditOutlined } from '@ant-design/icons';
import { Avatar, Button, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

export interface OvertimeRecord {
    key: string;
    employeeId: string;
    name: string;
    email: string;
    initials: string;
    profileImage?: string;
    date: string;
    rawDate: string;
    extraHours: number;
    overtimeRate: number;
    totalWorkingHours: number;
    hourlyRate: number;
    overtimeAmount: number;
    paymentStatus: string;
    status: string;
    notes: string | null;
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    requestedByEmployee: { label: 'Pending', color: '#B78912', bg: '#FFFAE6' },
    approved: { label: 'Approved', color: '#027A48', bg: '#ECFDF3' },
    rejected: { label: 'Rejected', color: '#CF4C00', bg: '#FFF9F5' },
    cancelledByEmployee: { label: 'Cancelled by Employee', color: '#8c8c8c', bg: '#f5f5f5' },
};

const paymentStatusConfig: Record<string, { color: string; bg: string; label: string }> = {
    PAID: { color: '#027A48', bg: '#ECFDF3', label: 'Paid' },
    UNPAID: { color: '#B78912', bg: '#FFFAE6', label: 'Unpaid' },
};

const formatInr = (v: number | null | undefined) => `₹${(v ?? 0).toFixed(2)}`;

const statusPill = (s: string) => {
    const cfg = statusConfig[s] ?? { label: s ?? '--', color: '#595959', bg: '#f5f5f5' };
    return (
        <Tag
            style={{
                color: cfg.color,
                backgroundColor: cfg.bg,
                borderColor: 'transparent',
                borderRadius: 9999,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
            }}
        >
            <span
                style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: cfg.color,
                    flexShrink: 0,
                    display: 'inline-block',
                }}
            />
            {cfg.label}
        </Tag>
    );
};

export const overtimePrimaryColumns: ColumnsType<OvertimeRecord> = [
    {
        title: 'Name',
        dataIndex: 'name',
        width: '45%',
        render: (_, record) => (
            <div className="flex items-center gap-2">
                <Avatar
                    src={record.profileImage || undefined}
                    style={{ backgroundColor: '#FFF5F5', color: '#FF9F9F', flexShrink: 0 }}
                >
                    {!record.profileImage && record.initials}
                </Avatar>
                <div className="flex flex-col min-w-0">
                    <Typography.Text className="font-medium text-sm" ellipsis>
                        {record.name}
                    </Typography.Text>
                    <Typography.Text className="text-xs text-gray-400" ellipsis>
                        {record.email}
                    </Typography.Text>
                </div>
            </div>
        ),
    },
    { title: 'Date', dataIndex: 'date', width: '25%', render: (v: string) => v ?? '--' },
    { title: 'Status', dataIndex: 'status', width: '30%', render: statusPill },
];

export const overtimeExpandedRow = (record: OvertimeRecord) => (
    <div className="flex flex-wrap gap-x-8 gap-y-2 bg-gray-50 px-4 py-3 rounded">
        <div>
            <Typography.Text className="text-xs text-gray-400 block">Extra Hours</Typography.Text>
            <Typography.Text className="text-sm">
                {record.extraHours != null ? `${record.extraHours} hrs` : '--'}
            </Typography.Text>
        </div>
        <div>
            <Typography.Text className="text-xs text-gray-400 block">OT Rate</Typography.Text>
            <Typography.Text className="text-sm">
                {record.overtimeRate != null ? `${record.overtimeRate}x` : '--'}
            </Typography.Text>
        </div>
        <div>
            <Typography.Text className="text-xs text-gray-400 block">Working Hrs</Typography.Text>
            <Typography.Text className="text-sm">
                {record.totalWorkingHours != null ? `${record.totalWorkingHours} hrs` : '--'}
            </Typography.Text>
        </div>
        <div>
            <Typography.Text className="text-xs text-gray-400 block">Hourly Rate</Typography.Text>
            <Typography.Text className="text-sm">{formatInr(record.hourlyRate)}</Typography.Text>
        </div>
        <div>
            <Typography.Text className="text-xs text-gray-400 block">OT Amount</Typography.Text>
            <Typography.Text className="text-sm">
                {formatInr(record.overtimeAmount)}
            </Typography.Text>
        </div>
        <div>
            <Typography.Text className="text-xs text-gray-400 block">Payment</Typography.Text>
            {(() => {
                const cfg = paymentStatusConfig[record.paymentStatus] ?? {
                    color: '#595959',
                    bg: '#f5f5f5',
                    label: record.paymentStatus ?? '--',
                };
                return (
                    <Tag
                        style={{
                            color: cfg.color,
                            backgroundColor: cfg.bg,
                            borderColor: 'transparent',
                            borderRadius: 9999,
                        }}
                    >
                        {cfg.label}
                    </Tag>
                );
            })()}
        </div>
        {record.notes && (
            <div className="w-full">
                <Typography.Text className="text-xs text-gray-400 block">Notes</Typography.Text>
                <Typography.Text className="text-sm">{record.notes}</Typography.Text>
            </div>
        )}
    </div>
);

export const overtimeColumns = (
    onApprove?: (key: string) => void,
    onReject?: (key: string) => void,
    onView?: (key: string) => void,
    onEdit?: (record: OvertimeRecord) => void
): ColumnsType<OvertimeRecord> => [
    {
        title: 'Name',
        dataIndex: 'name',
        render: (_, record) => (
            <div className="flex items-center gap-3">
                <Avatar
                    src={record.profileImage || undefined}
                    style={{ backgroundColor: '#FFF5F5', color: '#FF9F9F', flexShrink: 0 }}
                >
                    {!record.profileImage && record.initials}
                </Avatar>
                <div className="flex flex-col">
                    <Typography.Text className="font-medium text-sm">{record.name}</Typography.Text>
                    <Typography.Text className="text-xs text-gray-400">
                        {record.email}
                    </Typography.Text>
                </div>
            </div>
        ),
    },
    { title: 'Date', dataIndex: 'date', render: (v: string) => v ?? '--' },
    {
        title: 'Extra Hours',
        dataIndex: 'extraHours',
        render: (v: number) => (v != null ? `${v} hrs` : '--'),
        align: 'center',
    },
    {
        title: 'OT Rate',
        dataIndex: 'overtimeRate',
        render: (v: number) => (v != null ? `${v}x` : '--'),
        align: 'center',
    },
    {
        title: 'Working Hrs',
        dataIndex: 'totalWorkingHours',
        render: (v: number) => (v != null ? `${v} hrs` : '--'),
        align: 'center',
    },
    { title: 'OT Amount', dataIndex: 'overtimeAmount', render: formatInr, align: 'right' },
    {
        title: 'Payment',
        dataIndex: 'paymentStatus',
        align: 'center',
        render: (s: string) => {
            const cfg = paymentStatusConfig[s] ?? {
                color: '#595959',
                bg: '#f5f5f5',
                label: s ?? '--',
            };
            return (
                <Tag
                    style={{
                        color: cfg.color,
                        backgroundColor: cfg.bg,
                        borderColor: 'transparent',
                        borderRadius: 9999,
                    }}
                >
                    {cfg.label}
                </Tag>
            );
        },
    },
    { title: 'Status', dataIndex: 'status', render: statusPill },
    {
        title: 'Actions',
        key: 'actions',
        render: (_, record) => {
            if (record.status === 'requestedByEmployee') {
                return (
                    <div className="flex items-center gap-2">
                        <Button
                            size="small"
                            style={{ color: '#027A48', borderColor: '#027A48', borderRadius: 6 }}
                            onClick={() => onApprove?.(record.key)}
                        >
                            Approve
                        </Button>
                        <Button
                            size="small"
                            style={{ color: '#CF4C00', borderColor: '#CF4C00', borderRadius: 6 }}
                            onClick={() => onReject?.(record.key)}
                        >
                            Reject
                        </Button>
                        <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => onEdit?.(record)}
                        />
                    </div>
                );
            }
            return (
                <Button
                    size="small"
                    style={{ color: '#2F54EB', borderColor: '#2F54EB', borderRadius: 6 }}
                    onClick={() => onView?.(record.key)}
                >
                    View Details
                </Button>
            );
        },
    },
];
