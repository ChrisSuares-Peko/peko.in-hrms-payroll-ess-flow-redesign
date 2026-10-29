import type { CSSProperties } from 'react';

import { CloseOutlined, MailOutlined, MessageOutlined, SendOutlined } from '@ant-design/icons';
import { Button, Flex, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import type { ReminderRow } from '../../types/page-props/reminders';

export const TABLE_HEADER_STYLE: CSSProperties = {
    backgroundColor: '#FAFBFB',
    color: '#42526D',
    fontWeight: 600,
    fontSize: '14px',
    borderBottom: '1.24px solid #EAECF0',
};

const statusColorMap: Record<string, string> = {
    pending: 'bg-[#FFF7ED] text-[#F97316]',
    completed: 'bg-[#ECFDF5] text-[#43B75D]',
    cancelled: 'bg-[#FEF2F2] text-[#EF4444]',
};

const getReminderColumns = (
    onSend?: (row: ReminderRow) => void,
    onCancel?: (row: ReminderRow) => void,
    statusFilter?: string[],
    acting?: { id: number; action: 'send' | 'cancel' } | null
): ColumnsType<ReminderRow> => [
    {
        title: 'Scheduled Date',
        dataIndex: 'scheduledDate',
        key: 'scheduledDate',
        sorter: true,
        render: (date, row) => (
            <Flex vertical gap={2}>
                <Typography.Text className="text-[#42526D]">{date}</Typography.Text>
                {row.invoiceStatus && (
                    <Typography.Text
                        className={`text-xs font-medium ${
                            row.invoiceStatus !== 'PAID' ? 'text-[#EF4444]' : 'text-[#A1A1AA]'
                        }`}
                    >
                        {row.invoiceStatus}
                    </Typography.Text>
                )}
            </Flex>
        ),
    },
    {
        title: 'Invoice',
        key: 'invoice',
        render: (_, row) => (
            <Flex vertical gap={1}>
                <Typography.Text className="text-[#42526D] text-sm font-semibold">
                    {row.invoiceNo}
                </Typography.Text>
                <Typography.Text className="text-[#42526D] text-xs">
                    {row.customerName}
                </Typography.Text>
                <Typography.Text className="text-[#A1A1AA] text-xs">
                    {row.customerEmail}
                </Typography.Text>
            </Flex>
        ),
    },
    {
        title: 'Total Amount',
        dataIndex: 'totalAmount',
        key: 'totalAmount',
        render: (amount, row) => (
            <Typography.Text className="text-[#42526D] text-sm">
                {row.currency ?? 'INR'}{' '}
                {(Number(amount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </Typography.Text>
        ),
    },
    {
        title: 'Amount Due',
        dataIndex: 'amountDue',
        key: 'amountDue',
        sorter: true,
        render: (amount, row) => (
            <Typography.Text className="text-[#42526D] text-sm">
                {row.currency ?? 'INR'}{' '}
                {(Number(amount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </Typography.Text>
        ),
    },
    {
        title: 'Channel',
        dataIndex: 'channels',
        key: 'channels',
        render: (channels: ReminderRow['channels']) => (
            <Flex gap={4} align="center">
                {channels?.map(ch => (
                    <Flex
                        key={ch}
                        align="center"
                        justify="center"
                        className="w-7 h-7 rounded-full bg-[#F1F5F9]"
                    >
                        {ch === 'email' && <MailOutlined className="text-[#64748B] text-sm" />}
                        {ch === 'sms' && <MessageOutlined className="text-[#64748B] text-sm" />}
                    </Flex>
                ))}
            </Flex>
        ),
    },
    {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        filters: [
            { text: 'Pending', value: 'PENDING' },
            { text: 'Completed', value: 'COMPLETED' },
            { text: 'Cancelled', value: 'CANCELLED' },
        ],
        filterMultiple: false,
        filteredValue: statusFilter ?? null,
        render: (status: ReminderRow['status']) => {
            const key = status?.toLowerCase();
            return (
                <Tag
                    className={`rounded-full text-xs font-medium border-0 px-3 py-1 ${
                        statusColorMap[key] ?? 'bg-[#F4F4F5] text-[#71717A]'
                    }`}
                >
                    {status}
                </Tag>
            );
        },
    },
    {
        title: 'Actions',
        key: 'actions',
        render: (_, row) => (
            <Flex align="center" gap={6}>
                {row.status === 'Pending' ? (
                    <>
                        <Button
                            type="primary"
                            danger
                            className="text-xs h-7"
                            icon={<SendOutlined />}
                            loading={acting?.id === row.id && acting?.action === 'send'}
                            onClick={() => onSend?.(row)}
                        >
                            Send
                        </Button>
                        <Button
                            type="text"
                            className="text-[#A1A1AA] hover:text-[#EF4444] w-7 h-7 flex items-center justify-center border border-[#E4E4E7] rounded-full p-0"
                            icon={<CloseOutlined className="text-xs" />}
                            loading={acting?.id === row.id && acting?.action === 'cancel'}
                            onClick={() => onCancel?.(row)}
                        />
                    </>
                ) : (
                    <>
                        <Button
                            type="primary"
                            danger
                            disabled
                            className="text-xs h-7"
                            icon={<SendOutlined />}
                        >
                            Send
                        </Button>
                        <Button
                            disabled
                            type="text"
                            className="text-[#A1A1AA] hover:text-[#EF4444] w-7 h-7 flex items-center justify-center border border-[#E4E4E7] rounded-full p-0"
                            icon={<CloseOutlined className="text-xs" />}
                        />
                    </>
                )}
            </Flex>
        ),
    },
];

export default getReminderColumns;
