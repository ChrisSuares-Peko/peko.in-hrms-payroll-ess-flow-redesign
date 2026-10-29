import { Avatar, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

export type ShiftStatus = 'present' | 'late' | 'absent' | 'off';

export interface ShiftSlot {
    date: string;
    dayLabel: string;
    scheduledStart: string | null;
    scheduledEnd: string | null;
    checkIn: string | null;
    checkOut: string | null;
    totalHours: number;
    lateMinutes: number;
    status: ShiftStatus;
}

export interface ShiftScheduleRecord {
    key: string;
    name: string;
    email: string;
    initials: string;
    profileImage?: string | null;
    department: string;
    days: ShiftSlot[];
    totalHours: string;
}

const slotColors: Record<Exclude<ShiftStatus, 'off'>, { color: string; bg: string; border: string }> = {
    present: { color: '#027A48', bg: '#ECFDF3', border: '#027A48' },
    late: { color: '#B78912', bg: '#FFFAE6', border: '#B78912' },
    absent: { color: '#CF4C00', bg: '#FFF9F5', border: '#CF4C00' },
};

const boxStyle = (cfg: { color: string; bg: string; border: string }) => ({
    color: cfg.color,
    backgroundColor: cfg.bg,
    border: `1px solid ${cfg.border}`,
    borderRadius: 4,
    padding: '1px 8px',
    fontSize: 12,
    textAlign: 'center' as const,
    lineHeight: '20px',
    display: 'block',
    minWidth: 52,
});

const renderSlot = (slot?: ShiftSlot) => {
    if (!slot || (!slot.scheduledStart && !slot.scheduledEnd)) {
        return (
            <Typography.Text className="text-sm text-gray-400" style={{ display: 'block', textAlign: 'center' }}>
                --
            </Typography.Text>
        );
    }
    if (slot.status === 'off') {
        return (
            <div style={{ textAlign: 'center', padding: '4px 0' }}>
                <Typography.Text className="text-sm text-gray-400">OFF</Typography.Text>
            </div>
        );
    }
    const cfg = slot.status === 'present' ? slotColors.present : slotColors.absent;
    const inTime = slot.scheduledStart || '--';
    const outTime = slot.scheduledEnd || '--';
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
            <span style={boxStyle(cfg)}>{inTime}</span>
            <span style={boxStyle(cfg)}>{outTime}</span>
        </div>
    );
};

const renderName = (record: ShiftScheduleRecord) => (
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

const renderDept = (dept: string) => (
    <Tag style={{ color: '#861E99', backgroundColor: '#F9F0FB', borderColor: 'transparent', borderRadius: 9999, fontWeight: 600 }}>
        {dept}
    </Tag>
);

export const shiftSchedulePrimaryColumns: ColumnsType<ShiftScheduleRecord> = [
    {
        title: 'Name',
        dataIndex: 'name',
        width: '45%',
        render: (_, record) => renderName(record),
    },
    {
        title: 'Department',
        dataIndex: 'department',
        width: '30%',
        render: renderDept,
    },
    {
        title: 'Total Hours',
        dataIndex: 'totalHours',
        width: '25%',
        render: (val: string) => <Typography.Text className="text-sm font-medium">{val}</Typography.Text>,
    },
];

export const shiftScheduleExpandedRow = (record: ShiftScheduleRecord) => (
    <div className="flex flex-wrap gap-x-6 gap-y-3 bg-gray-50 px-4 py-3 rounded">
        {record.days.map((slot, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
                <Typography.Text className="text-xs text-gray-400 block">{slot.dayLabel}</Typography.Text>
                {renderSlot(slot)}
            </div>
        ))}
    </div>
);

export const shiftScheduleColumns = (dayLabels: string[] = []): ColumnsType<ShiftScheduleRecord> => [
    {
        title: 'Name',
        dataIndex: 'name',
        width: '18%',
        render: (_, record) => renderName(record),
    },
    {
        title: 'Department',
        dataIndex: 'department',
        width: '12%',
        render: renderDept,
    },
    ...dayLabels.map((day, i) => ({
        title: day,
        key: `day_${i}`,
        width: '10%',
        align: 'center' as const,
        render: (_: unknown, record: ShiftScheduleRecord) => renderSlot(record.days[i]),
    })),
    {
        title: 'Total Hours',
        dataIndex: 'totalHours',
        width: '9%',
        align: 'center' as const,
        render: (val: string) => <Typography.Text className="text-sm font-medium">{val}</Typography.Text>,
    },
];
