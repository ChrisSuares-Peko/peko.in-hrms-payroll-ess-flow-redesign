import { BellOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { Flex, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import { REMINDER_STATUS_STYLE } from '../../constants/style';
import { ScheduledReminderRow } from '../../types/payments';
import { formatAmount, formatDate } from '../helperFunctions';

export const scheduledReminderColumns: ColumnsType<ScheduledReminderRow> = [
    {
        title: 'Invoice ID',
        dataIndex: 'invoiceId',
        key: 'invoiceId',
        render: (v: string) => (
            <Typography.Text className="text-[#42526D] text-sm">{v}</Typography.Text>
        ),
    },
    {
        title: 'Customer',
        dataIndex: 'customer',
        key: 'customer',
        render: (v: string) => (
            <Typography.Text className="text-[#42526D] text-sm">{v}</Typography.Text>
        ),
    },
    {
        title: 'Outstanding',
        dataIndex: 'outstanding',
        key: 'outstanding',
        render: (v: number) => (
            <Typography.Text className="text-[#42526D] text-sm">{formatAmount(v)}</Typography.Text>
        ),
    },
    {
        title: 'Due Date',
        dataIndex: 'dueDate',
        key: 'dueDate',
        render: (v: string) => (
            <Typography.Text className="text-[#42526D] text-sm">{formatDate(v)}</Typography.Text>
        ),
    },
    {
        title: 'Reminder Status',
        dataIndex: 'reminderStatus',
        key: 'reminderStatus',
        render: (v: ScheduledReminderRow['reminderStatus']) => (
            <Tag
                className={`rounded-full text-xs font-medium border-0 px-3 py-1 ${REMINDER_STATUS_STYLE[v]}`}
            >
                {v}
            </Tag>
        ),
    },
    {
        title: 'Next Reminder',
        dataIndex: 'nextReminder',
        key: 'nextReminder',
        render: (v: string) => (
            <Typography.Text className="text-[#42526D] text-sm">{v}</Typography.Text>
        ),
    },
    {
        title: 'Actions',
        key: 'actions',
        render: () => (
            <Flex align="center" gap={16}>
                <BellOutlined className="text-[#A1A1AA] cursor-pointer hover:text-[#475569]" />
                <ReloadOutlined className="text-[#A1A1AA] cursor-pointer hover:text-[#475569]" />
                <DeleteOutlined className="text-[#A1A1AA] cursor-pointer hover:text-[#FF4F4F]" />
            </Flex>
        ),
    },
];
