import { MoreOutlined } from '@ant-design/icons';
import { Button, Dropdown, Tag } from 'antd';
import dayjs from 'dayjs';

import type { AttendanceStatus, TimesheetRecord } from '../timesheet/data';

export const attendanceStatusConfig: Record<AttendanceStatus, { color: string; bg: string }> = {
    Present: { color: '#027A48', bg: '#ECFDF3' },
    Late: { color: '#B78912', bg: '#FFFAE6' },
    Absent: { color: '#CF4C00', bg: '#FFF9F5' },
    'On Leave': { color: '#2F54EB', bg: '#F0F5FF' },
    'Half Day': { color: '#722ed1', bg: '#f9f0ff' },
};

export const ATTENDANCE_STAT_META = [
    { key: 'present', label: 'Present', color: '#027A48', bg: '#ECFDF3' },
    { key: 'late', label: 'Late', color: '#B78912', bg: '#FFFAE6' },
    { key: 'absent', label: 'Absent', color: '#CF4C00', bg: '#FFF9F5' },
    { key: 'onLeave', label: 'On Leave', color: '#6941C6', bg: '#F9F5FF' },
    { key: 'otHours', label: 'OT Hours', color: '#2F54EB', bg: '#F0F5FF' },
] as const;

export const attendanceColumns = (onEdit: (record: TimesheetRecord) => void) => [
    { title: 'Date', dataIndex: 'date', key: 'date', width: 110 },
    {
        title: 'Day',
        dataIndex: 'date',
        key: 'dayOfWeek',
        width: 80,
        render: (date: string) => dayjs(date, 'DD MMM YYYY').format('ddd'),
    },
    {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        width: 130,
        render: (status: AttendanceStatus) => {
            const cfg = attendanceStatusConfig[status] ?? attendanceStatusConfig.Present;
            return (
                <Tag
                    bordered={false}
                    style={{
                        color: cfg.color,
                        backgroundColor: cfg.bg,
                        borderRadius: 9999,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '2px 10px',
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
        },
    },
    { title: 'Shift', dataIndex: 'shift', key: 'shift', width: 130 },
    { title: 'Check In', dataIndex: 'checkIn', key: 'checkIn', width: 110 },
    { title: 'Check Out', dataIndex: 'checkOut', key: 'checkOut', width: 110 },
    { title: 'Hours', dataIndex: 'workHrs', key: 'workHrs', width: 90 },
    { title: 'OT Hours', dataIndex: 'otHours', key: 'otHours', width: 90 },
    {
        title: '',
        key: 'actions',
        width: 60,
        render: (_: any, record: TimesheetRecord) => (
            <Dropdown
                menu={{
                    items: [{ key: 'edit', label: 'Edit' }],
                    onClick: ({ key }) => { if (key === 'edit') onEdit(record); },
                }}
                trigger={['click']}
            >
                <Button type="text" size="small" icon={<MoreOutlined />} />
            </Dropdown>
        ),
    },
];
