import { Avatar, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

export type AttendanceStatus = 'Present' | 'Late' | 'Absent' | 'On Leave' | 'Half Day';

export interface TimesheetRecord {
    key: string;
    name: string;
    email: string;
    initials: string;
    profileImage?: string | null;
    color: string;
    date: string;
    shift: string;
    checkIn: string;
    checkOut: string;
    workHrs: string;
    otHours?: string;
    status: AttendanceStatus;
    lateMinutes?: number;
    employeeId: string;
    rawDate: string;
    rawCheckIn: string;
    rawCheckOut: string;
    rawStatus: string;
    rawNotes: string;
}

const statusConfig: Record<AttendanceStatus, { color: string; bg: string }> = {
    Present: { color: '#027A48', bg: '#ECFDF3' },
    Late: { color: '#B78912', bg: '#FFFAE6' },
    Absent: { color: '#CF4C00', bg: '#FFF9F5' },
    'On Leave': { color: '#2F54EB', bg: '#F0F5FF' },
    'Half Day': { color: '#722ed1', bg: '#f9f0ff' },
};

const renderStatusTag = (status: TimesheetRecord['status']) => {
    const cfg = statusConfig[status];
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
            {status}
        </Tag>
    );
};

export const timesheetPrimaryColumns: ColumnsType<TimesheetRecord> = [
    {
        title: 'Name',
        dataIndex: 'name',
        width: '50%',
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
    },
    { title: 'Date', dataIndex: 'date', width: '25%' },
    { title: 'Status', dataIndex: 'status', width: '25%', render: renderStatusTag },
];

export const timesheetExpandedRow = (record: TimesheetRecord) => (
    <div className="flex flex-wrap gap-x-8 gap-y-2 bg-gray-50 px-4 py-3 rounded">
        <div>
            <Typography.Text className="text-xs text-gray-400 block">Shift</Typography.Text>
            <Typography.Text className="text-sm">{record.shift}</Typography.Text>
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
            <Typography.Text className="text-xs text-gray-400 block">Work Hrs</Typography.Text>
            <Typography.Text className="text-sm">{record.workHrs}</Typography.Text>
        </div>
    </div>
);

export const timesheetColumns: ColumnsType<TimesheetRecord> = [
    {
        title: 'Name',
        dataIndex: 'name',
        render: (_, record) => (
            <div className="flex items-center gap-3">
                <Avatar src={record.profileImage || undefined} style={{ backgroundColor: '#FFF5F5', color: '#FF9F9F', flexShrink: 0 }}>
                    {!record.profileImage && record.initials}
                </Avatar>
                <div className="flex flex-col">
                    <Typography.Text className="font-medium text-sm">{record.name}</Typography.Text>
                    <Typography.Text className="text-xs text-gray-400">{record.email}</Typography.Text>
                </div>
            </div>
        ),
    },
    { title: 'Date', dataIndex: 'date' },
    { title: 'Shift', dataIndex: 'shift' },
    { title: 'Check-In', dataIndex: 'checkIn' },
    { title: 'Check-Out', dataIndex: 'checkOut' },
    { title: 'Work Hrs', dataIndex: 'workHrs' },
    { title: 'Status', dataIndex: 'status', render: renderStatusTag },
];
