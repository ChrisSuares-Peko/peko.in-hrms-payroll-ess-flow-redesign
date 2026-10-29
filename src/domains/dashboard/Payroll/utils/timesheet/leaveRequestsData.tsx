import { Avatar, Button, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

export type LeaveStatus = 'Approved' | 'Pending' | 'Rejected' | 'Cancelled';

export interface LeaveRequestRecord {
    key: string;
    name: string;
    email: string;
    initials: string;
    profileImage?: string;
    leaveType: string;
    fromDate: string;
    toDate: string;
    duration: string;
    reason: string;
    appliedOn: string;
    status: LeaveStatus;
}

// HR can configure custom leave types beyond this default set, so this is a
// label lookup with a fallback style rather than a fixed enum.
const leaveTypeConfig: Record<string, { color: string; bg: string }> = {
    'Annual Leave': { color: '#027A48', bg: '#ECFDF3' },
    'Sick Leave': { color: '#2F54EB', bg: '#F0F5FF' },
    'Casual Leave': { color: '#B78912', bg: '#FFFAE6' },
    'Maternity Leave': { color: '#C41D7F', bg: '#FFF0F6' },
    'Paternity Leave': { color: '#0958D9', bg: '#E6F4FF' },
    'Unpaid Leave': { color: '#8c8c8c', bg: '#f5f5f5' },
};
const defaultLeaveTypeStyle = { color: '#CF4C00', bg: '#FFF9F5' };

const statusConfig: Record<LeaveStatus, { color: string; bg: string }> = {
    Approved: { color: '#027A48', bg: '#ECFDF3' },
    Pending: { color: '#B78912', bg: '#FFFAE6' },
    Rejected: { color: '#CF4C00', bg: '#FFF9F5' },
    Cancelled: { color: '#8c8c8c', bg: '#f5f5f5' },
};

const dot = (color: string) => (
    <span
        style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: color,
            flexShrink: 0,
            display: 'inline-block',
        }}
    />
);

const pill = (label: string, color: string, bg: string, withDot = false) => (
    <Tag
        style={{
            color,
            backgroundColor: bg,
            borderColor: 'transparent',
            borderRadius: 9999,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
        }}
    >
        {withDot && dot(color)}
        {label}
    </Tag>
);

const nameColumn: ColumnsType<LeaveRequestRecord>[number] = {
    title: 'Name',
    dataIndex: 'name',
    render: (_, record) => (
        <div className="flex items-center gap-2">
            <Avatar src={record.profileImage || undefined} style={{ backgroundColor: '#FFF5F5', color: '#FF9F9F', flexShrink: 0 }}>
                {!record.profileImage && record.initials}
            </Avatar>
            <div className="flex flex-col min-w-0">
                <Typography.Text className="font-medium text-sm" ellipsis>{record.name}</Typography.Text>
                <Typography.Text className="text-xs text-gray-400" ellipsis>{record.email}</Typography.Text>
            </div>
        </div>
    ),
};

const leaveTypeColumn: ColumnsType<LeaveRequestRecord>[number] = {
    title: 'Leave Type',
    dataIndex: 'leaveType',
    render: (type: string) => {
        const cfg = leaveTypeConfig[type] ?? defaultLeaveTypeStyle;
        return pill(type, cfg.color, cfg.bg);
    },
};

const statusColumn: ColumnsType<LeaveRequestRecord>[number] = {
    title: 'Status',
    dataIndex: 'status',
    render: (status: LeaveStatus) => {
        const cfg = statusConfig[status];
        return pill(status, cfg.color, cfg.bg, true);
    },
};

const buildActionsColumn = (
    onApprove?: (key: string) => void,
    onReject?: (key: string) => void
): ColumnsType<LeaveRequestRecord>[number] => ({
    title: 'Actions',
    key: 'actions',
    width: '14%',
    render: (_, record) => {
        if (record.status !== 'Pending') return null;
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
            </div>
        );
    },
});

export const leaveRequestsColumns = (
    onApprove?: (key: string) => void,
    onReject?: (key: string) => void
): ColumnsType<LeaveRequestRecord> => [
    { ...nameColumn, width: '18%' },
    { ...leaveTypeColumn, width: '10%' },
    { title: 'From Date', dataIndex: 'fromDate', width: '10%' },
    { title: 'To Date', dataIndex: 'toDate', width: '10%' },
    { title: 'Duration', dataIndex: 'duration', width: '8%' },
    {
        title: 'Reason',
        dataIndex: 'reason',
        width: '16%',
        render: (val: string) => (
            <Typography.Text ellipsis={{ tooltip: val }} className="text-sm block">
                {val}
            </Typography.Text>
        ),
    },
    { title: 'Applied On', dataIndex: 'appliedOn', width: '10%' },
    { ...statusColumn, width: '8%' },
    buildActionsColumn(onApprove, onReject),
];

export const leaveRequestsPrimaryColumns: ColumnsType<LeaveRequestRecord> = [
    { ...nameColumn, width: '45%' },
    { ...leaveTypeColumn, width: '30%' },
    { ...statusColumn, width: '25%' },
];

export const leaveRequestsExpandedRow = (record: LeaveRequestRecord) => (
    <div className="flex flex-wrap gap-x-8 gap-y-2 bg-gray-50 px-4 py-3 rounded">
        <div>
            <Typography.Text className="text-xs text-gray-400 block">From Date</Typography.Text>
            <Typography.Text className="text-sm">{record.fromDate}</Typography.Text>
        </div>
        <div>
            <Typography.Text className="text-xs text-gray-400 block">To Date</Typography.Text>
            <Typography.Text className="text-sm">{record.toDate}</Typography.Text>
        </div>
        <div>
            <Typography.Text className="text-xs text-gray-400 block">Duration</Typography.Text>
            <Typography.Text className="text-sm">{record.duration}</Typography.Text>
        </div>
        <div>
            <Typography.Text className="text-xs text-gray-400 block">Applied On</Typography.Text>
            <Typography.Text className="text-sm">{record.appliedOn}</Typography.Text>
        </div>
        <div className="w-full">
            <Typography.Text className="text-xs text-gray-400 block">Reason</Typography.Text>
            <Typography.Text className="text-sm">{record.reason}</Typography.Text>
        </div>
    </div>
);
