import { DownloadOutlined, EyeOutlined, LoadingOutlined } from '@ant-design/icons';
import { Flex, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import { PAYMENT_STATUS_STYLE } from '../../constants/style';
import { PaymentRow } from '../../types/payments';
import { formatAmount, formatDate } from '../helperFunctions';

export type { PaymentRow };

const getPaymentTrackingColumns = (
    statusFilter?: string[],
    methodFilter?: string[],
    onView?: (id: string) => void,
    onDownload?: (invoiceId: number) => void,
    downloadingId?: number | null
): ColumnsType<PaymentRow> => [
    {
        title: 'Payment ID',
        dataIndex: 'paymentId',
        key: 'paymentId',
        render: (v: string) => (
            <Typography.Text className="text-[#42526D] text-sm">{v}</Typography.Text>
        ),
    },
    {
        title: 'Customer',
        dataIndex: 'customer',
        key: 'customer',
        sorter: true,
        render: (v: string) => (
            <Typography.Text className="text-[#42526D] text-sm">{v}</Typography.Text>
        ),
    },
    {
        title: 'Invoice Reference',
        dataIndex: 'invoiceRef',
        key: 'invoiceRef',
        render: (v: string) => (
            <Typography.Text className="text-[#42526D] text-sm">{v}</Typography.Text>
        ),
    },
    {
        title: 'Amount',
        dataIndex: 'amount',
        key: 'amount',
        sorter: true,
        render: (v: number) => (
            <Typography.Text className="text-[#42526D] text-sm">{formatAmount(v)}</Typography.Text>
        ),
    },
    {
        title: 'Method',
        dataIndex: 'method',
        key: 'method',
        filteredValue: methodFilter ?? null,
        filterMultiple: false,
        filters: [
            { text: 'Cash', value: 'Cash' },
            { text: 'Bank Transfer', value: 'Bank Transfer' },
            { text: 'Cheque', value: 'Cheque' },
            { text: 'UPI', value: 'UPI' },
        ],
        render: (v: string) => (
            <Typography.Text className="text-[#42526D] text-sm">{v}</Typography.Text>
        ),
    },
    {
        title: 'Date',
        dataIndex: 'date',
        key: 'date',
        sorter: true,
        render: (v: string) => (
            <Typography.Text className="text-[#42526D] text-sm">{formatDate(v)}</Typography.Text>
        ),
    },
    {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        filteredValue: statusFilter ?? null,
        filterMultiple: false,
        filters: [
            { text: 'Success', value: 'SUCCESS' },
            { text: 'Pending', value: 'PENDING' },
            { text: 'Failed', value: 'FAILED' },
        ],
        render: (v: PaymentRow['status']) => (
            <Tag
                className={`rounded-full text-xs font-medium border-0 px-3 py-1 ${PAYMENT_STATUS_STYLE[v] ?? 'bg-[#F4F4F5] text-[#71717A]'}`}
            >
                {v}
            </Tag>
        ),
    },
    {
        title: 'Actions',
        key: 'actions',
        render: (_: unknown, record: PaymentRow) => {
            const isDownloading = record.invoiceId != null && downloadingId === record.invoiceId;
            return (
                <Flex align="center" gap={16}>
                    <EyeOutlined
                        className="text-[#A1A1AA] cursor-pointer hover:text-[#475569]"
                        onClick={() => onView?.(record.id)}
                    />
                    {isDownloading ? (
                        <LoadingOutlined className="text-[#A1A1AA]" spin />
                    ) : (
                        <DownloadOutlined
                            className={`text-[#A1A1AA] ${record.invoiceId != null ? 'cursor-pointer hover:text-[#475569]' : 'opacity-40 cursor-not-allowed'}`}
                            onClick={() => record.invoiceId != null && onDownload?.(record.invoiceId)}
                        />
                    )}
                </Flex>
            );
        },
    },
];

export default getPaymentTrackingColumns;
