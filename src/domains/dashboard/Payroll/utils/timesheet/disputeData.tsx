import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { Avatar, Button, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

export type DisputeStatus = 'pending' | 'approved' | 'rejected';

export interface DisputeRecord {
    key: string;
    name: string;
    email: string;
    initials: string;
    profileImage?: string;
    date: string;
    disputeType: string;
    checkIn: string;
    checkOut: string;
    reason: string;
    status: DisputeStatus;
    submittedOn: string;
    remarks?: string | null;
}

const DISPUTE_TYPE_LABELS: Record<string, string> = {
    absent: 'Absent',
    late: 'Late Arrival',
};

export const formatDisputeType = (type: string) => DISPUTE_TYPE_LABELS[type] ?? type;

const statusConfig: Record<DisputeStatus, { label: string; color: string; bg: string }> = {
    pending: { label: 'Pending', color: '#B78912', bg: '#FFFAE6' },
    approved: { label: 'Approved', color: '#027A48', bg: '#ECFDF3' },
    rejected: { label: 'Rejected', color: '#CF4C00', bg: '#FFF9F5' },
};

const statusPill = (s: DisputeStatus) => {
    const cfg = statusConfig[s] ?? { label: s, color: '#595959', bg: '#f5f5f5' };
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
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: cfg.color, flexShrink: 0, display: 'inline-block' }} />
            {cfg.label}
        </Tag>
    );
};

const renderName = (record: DisputeRecord) => (
    <div className="flex items-center gap-2">
        <Avatar src={record.profileImage || undefined} style={{ backgroundColor: '#FFF5F5', color: '#FF9F9F', flexShrink: 0 }}>
            {!record.profileImage && record.initials}
        </Avatar>
        <div className="flex flex-col min-w-0">
            <Typography.Text className="font-medium text-sm" ellipsis>{record.name}</Typography.Text>
            <Typography.Text className="text-xs text-gray-400" ellipsis>{record.email}</Typography.Text>
        </div>
    </div>
);

export const disputePrimaryColumns: ColumnsType<DisputeRecord> = [
    {
        title: 'Employee',
        dataIndex: 'name',
        width: '45%',
        render: (_, record) => renderName(record),
    },
    { title: 'Date', dataIndex: 'date', width: '25%' },
    { title: 'Status', dataIndex: 'status', width: '30%', render: statusPill },
];

export const disputeExpandedRow = (record: DisputeRecord) => (
    <div className="flex flex-wrap gap-x-8 gap-y-2 bg-gray-50 px-4 py-3 rounded">
        <div>
            <Typography.Text className="text-xs text-gray-400 block">Dispute Type</Typography.Text>
            <Typography.Text className="text-sm">{formatDisputeType(record.disputeType)}</Typography.Text>
        </div>
        <div>
            <Typography.Text className="text-xs text-gray-400 block">Check-In</Typography.Text>
            <Typography.Text className="text-sm">{record.checkIn}</Typography.Text>
        </div>
        <div>
            <Typography.Text className="text-xs text-gray-400 block">Check-Out</Typography.Text>
            <Typography.Text className="text-sm">{record.checkOut}</Typography.Text>
        </div>
        <div>
            <Typography.Text className="text-xs text-gray-400 block">Submitted On</Typography.Text>
            <Typography.Text className="text-sm">{record.submittedOn}</Typography.Text>
        </div>
        {record.reason && (
            <div className="w-full">
                <Typography.Text className="text-xs text-gray-400 block">Reason</Typography.Text>
                <Typography.Text className="text-sm">{record.reason}</Typography.Text>
            </div>
        )}
    </div>
);

export const disputeColumns = (
    onApprove?: (key: string) => void,
    onReject?: (key: string) => void
): ColumnsType<DisputeRecord> => [
    {
        title: 'Employee',
        dataIndex: 'name',
        render: (_, record) => renderName(record),
    },
    { title: 'Date', dataIndex: 'date' },
    {
        title: 'Dispute Type',
        dataIndex: 'disputeType',
        render: formatDisputeType,
    },
    { title: 'Check-In', dataIndex: 'checkIn' },
    { title: 'Check-Out', dataIndex: 'checkOut' },
    {
        title: 'Reason',
        dataIndex: 'reason',
        width: 200,
        render: (val: string) => (
            <Typography.Text ellipsis={{ tooltip: val }} style={{ maxWidth: 200 }}>
                {val || '--'}
            </Typography.Text>
        ),
    },
    { title: 'Submitted On', dataIndex: 'submittedOn' },
    { title: 'Status', dataIndex: 'status', render: statusPill },
    {
        title: 'Actions',
        key: 'actions',
        render: (_, record) => {
            if (record.status !== 'pending') return null;
            return (
                <div className="flex flex-col gap-1">
                    <Button
                        size="small"
                        icon={<CheckOutlined />}
                        style={{ color: '#027A48', borderColor: '#027A48', borderRadius: 6 }}
                        onClick={() => onApprove?.(record.key)}
                    >
                        Approve
                    </Button>
                    <Button
                        size="small"
                        icon={<CloseOutlined />}
                        style={{ color: '#CF4C00', borderColor: '#CF4C00', borderRadius: 6 }}
                        onClick={() => onReject?.(record.key)}
                    >
                        Reject
                    </Button>
                </div>
            );
        },
    },
];
