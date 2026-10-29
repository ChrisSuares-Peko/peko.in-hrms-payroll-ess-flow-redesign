import { Avatar, Progress, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

export interface MonthlySummaryRecord {
    key: string;
    name: string;
    email: string;
    initials: string;
    profileImage?: string;
    designation: string;
    present: number;
    late: number;
    absent: number;
    onLeave: number;
    otHours: string;
    totalHours: string;
    attendancePct: number;
}

const getProgressColor = (pct: number) => {
    if (pct >= 90) return '#52c41a';
    if (pct >= 70) return '#fa8c16';
    return '#ff4d4f';
};

export const monthlySummaryPrimaryColumns: ColumnsType<MonthlySummaryRecord> = [
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
                    <Typography.Text className="font-medium text-sm" ellipsis>{record.name}</Typography.Text>
                    <Typography.Text className="text-xs text-gray-400" ellipsis>{record.designation}</Typography.Text>
                </div>
            </div>
        ),
    },
    {
        title: 'Attendance %',
        dataIndex: 'attendancePct',
        width: '30%',
        render: (pct: number) => (
            <div className="flex flex-col gap-1">
                <Typography.Text className="text-xs font-medium" style={{ color: getProgressColor(pct) }}>
                    {pct}%
                </Typography.Text>
                <Progress
                    percent={pct}
                    showInfo={false}
                    strokeColor={getProgressColor(pct)}
                    trailColor="#f0f0f0"
                    size={['100%', 6] as any}
                />
            </div>
        ),
    },
];

export const monthlySummaryExpandedRow = (record: MonthlySummaryRecord) => (
    <div className="flex flex-wrap gap-x-8 gap-y-2 bg-gray-50 px-4 py-3 rounded">
        <div>
            <Typography.Text className="text-xs text-gray-400 block">Present</Typography.Text>
            <Typography.Text className="text-sm">{record.present}</Typography.Text>
        </div>
        <div>
            <Typography.Text className="text-xs text-gray-400 block">Late</Typography.Text>
            <Typography.Text className="text-sm">{record.late}</Typography.Text>
        </div>
        <div>
            <Typography.Text className="text-xs text-gray-400 block">Absent</Typography.Text>
            <Typography.Text className="text-sm">{record.absent}</Typography.Text>
        </div>
        <div>
            <Typography.Text className="text-xs text-gray-400 block">On Leave</Typography.Text>
            <Typography.Text className="text-sm">{record.onLeave}</Typography.Text>
        </div>
        <div>
            <Typography.Text className="text-xs text-gray-400 block">OT Hours</Typography.Text>
            <Typography.Text className="text-sm">{record.otHours}</Typography.Text>
        </div>
        <div>
            <Typography.Text className="text-xs text-gray-400 block">Total Hours</Typography.Text>
            <Typography.Text className="text-sm">{record.totalHours}</Typography.Text>
        </div>
    </div>
);

export const monthlySummaryColumns: ColumnsType<MonthlySummaryRecord> = [
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
                    <Typography.Text className="text-xs text-gray-400">{record.designation}</Typography.Text>
                </div>
            </div>
        ),
    },
    { title: 'Present', dataIndex: 'present', align: 'center' },
    { title: 'Late', dataIndex: 'late', align: 'center' },
    { title: 'Absent', dataIndex: 'absent', align: 'center' },
    { title: 'On Leave', dataIndex: 'onLeave', align: 'center' },
    { title: 'OT Hours', dataIndex: 'otHours', align: 'center' },
    { title: 'Total Hours', dataIndex: 'totalHours', align: 'center' },
    {
        title: 'Attendance %',
        dataIndex: 'attendancePct',
        render: (pct: number) => (
            <div className="flex flex-col gap-1">
                <Typography.Text className="text-xs font-medium" style={{ color: getProgressColor(pct) }}>
                    {pct}%
                </Typography.Text>
                <Progress
                    percent={pct}
                    showInfo={false}
                    strokeColor={getProgressColor(pct)}
                    trailColor="#f0f0f0"
                    size={[120, 6]}
                />
            </div>
        ),
    },
];
