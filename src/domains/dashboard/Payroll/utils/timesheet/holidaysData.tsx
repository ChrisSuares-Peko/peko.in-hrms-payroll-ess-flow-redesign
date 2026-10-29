import { DeleteOutlined } from '@ant-design/icons';
import { Button, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

export type HolidayType = 'Public Holiday' | 'Optional Holiday' | 'Restricted Holiday';

export interface HolidayRecord {
    key: string;
    name: string;
    type: HolidayType;
    date: string;
    day: string;
    rawStart: string;
    rawEnd: string;
    rawCategory: string;
    rawSendPriorEmailDate?: string;
}

const typeConfig: Record<HolidayType, { color: string; bg: string }> = {
    'Public Holiday': { color: '#6941C6', bg: '#F9F5FF' },
    'Optional Holiday': { color: '#B78912', bg: '#FFFAE6' },
    'Restricted Holiday': { color: '#2F54EB', bg: '#F0F5FF' },
};

export const holidaysColumns = (
    onEdit?: (record: HolidayRecord) => void,
    onDelete?: (key: string) => void
): ColumnsType<HolidayRecord> => [
    {
        title: 'Holiday Name',
        dataIndex: 'name',
        width: '30%',
        render: (val: string) => <Typography.Text className="font-medium text-sm">{val}</Typography.Text>,
    },
    {
        title: 'Type',
        dataIndex: 'type',
        width: '16%',
        render: (type: HolidayType) => {
            const cfg = typeConfig[type];
            return (
                <Tag style={{ color: cfg.color, backgroundColor: cfg.bg, borderColor: 'transparent', borderRadius: 9999 }}>
                    {type}
                </Tag>
            );
        },
    },
    { title: 'Date', dataIndex: 'date', width: '18%' },
    { title: 'Day', dataIndex: 'day', width: '18%' },
    {
        title: 'Actions',
        key: 'actions',
        width: '18%',
        render: (_, record) => (
            <div className="flex items-center gap-2">
                <Button
                    size="small"
                    style={{ color: '#ff4f4f', borderColor: '#ff4f4f', borderRadius: 6 }}
                    onClick={() => onEdit?.(record)}
                >
                    Edit
                </Button>
                <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => onDelete?.(record.key)}
                />
            </div>
        ),
    },
];

export const holidaysPrimaryColumns: ColumnsType<HolidayRecord> = [
    {
        title: 'Holiday Name',
        dataIndex: 'name',
        width: '50%',
        render: (val: string) => <Typography.Text className="font-medium text-sm">{val}</Typography.Text>,
    },
    {
        title: 'Type',
        dataIndex: 'type',
        width: '30%',
        render: (type: HolidayType) => {
            const cfg = typeConfig[type];
            return (
                <Tag style={{ color: cfg.color, backgroundColor: cfg.bg, borderColor: 'transparent', borderRadius: 9999 }}>
                    {type}
                </Tag>
            );
        },
    },
];

export const holidaysExpandedRow = (record: HolidayRecord) => (
    <div className="flex flex-wrap gap-x-8 gap-y-2 bg-gray-50 px-4 py-3 rounded">
        <div>
            <Typography.Text className="text-xs text-gray-400 block">Date</Typography.Text>
            <Typography.Text className="text-sm">{record.date}</Typography.Text>
        </div>
        <div>
            <Typography.Text className="text-xs text-gray-400 block">Day</Typography.Text>
            <Typography.Text className="text-sm">{record.day}</Typography.Text>
        </div>
    </div>
);
