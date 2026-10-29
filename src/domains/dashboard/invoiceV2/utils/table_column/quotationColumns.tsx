import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Button, Flex, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import { TABLE_HEADER_STYLE } from './invoiceColumns';
import viewIcon from '../../assets/icons/invoiceList/view.svg';
import { InvoiceRow } from '../../types/invoice';
import { formatCurrencyAmount, formatDate, toTitleCase } from '../helperFunctions';

export { TABLE_HEADER_STYLE };

const STATUS_LABEL: Record<string, string> = {
    PENDING: 'Pending',
    ACCEPTED: 'Accepted',
    CANCELLED: 'Rejected',
    CONVERTED: 'Converted',
};

const STATUS_STYLE: Record<string, string> = {
    Pending: 'bg-[#FFF7ED] text-[#F97316]',
    Accepted: 'bg-[#ECFDF5] text-[#43B75D]',
    Rejected: 'bg-[#FEF2F2] text-[#EF4444]',
    Converted: 'bg-[#EFF6FF] text-[#3B82F6]',
};

const getQuotationColumns = (
    onView: (id: string) => void,
    onEdit: (id: string) => void,
    onDelete: (id: string) => void,
    statusFilter?: string[]
): ColumnsType<InvoiceRow> => [
    {
        title: 'Quotation ID',
        dataIndex: 'invoiceNumber',
        key: 'invoiceNumber',
        render: (num, record) => (
            <Typography.Text className="text-[#42526D] text-sm">
                {record.prefix ? `${record.prefix}${num}` : num}
            </Typography.Text>
        ),
    },
    {
        title: 'Customer',
        dataIndex: 'name',
        key: 'name',
        sorter: true,
        render: (name: string) => (
            <Typography.Text className="text-[#42526D] text-sm">{name}</Typography.Text>
        ),
    },
    {
        title: 'Issued Date',
        dataIndex: 'invoiceDate',
        key: 'invoiceDate',
        sorter: true,
        render: (date: string) => (
            <Typography.Text className="text-[#42526D] text-sm">{formatDate(date)}</Typography.Text>
        ),
    },
    {
        title: 'Valid Until',
        dataIndex: 'dueDate',
        key: 'dueDate',
        sorter: true,
        render: (date: string) => (
            <Typography.Text className="text-[#42526D] text-sm">
                {date ? formatDate(date) : '—'}
            </Typography.Text>
        ),
    },
    {
        title: 'Amount',
        dataIndex: 'totalAmount',
        key: 'totalAmount',
        sorter: true,
        render: (amount, record) => (
            <Typography.Text className="text-[#42526D] text-sm">
                {formatCurrencyAmount(record.originalTotalAmount ?? amount, record.currency)}
            </Typography.Text>
        ),
    },
    {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        filteredValue: statusFilter ?? null,
        filters: [
            { text: 'Pending', value: 'PENDING' },
            { text: 'Rejected', value: 'CANCELLED' },
            { text: 'Accepted', value: 'ACCEPTED' },
        ],
        render: (status: string) => {
            const label = STATUS_LABEL[status] ?? toTitleCase(status);
            return (
                <Tag
                    className={`rounded-full text-xs font-medium border-0 px-3 py-1 ${STATUS_STYLE[label] ?? 'bg-[#F4F4F5] text-[#71717A]'}`}
                >
                    {label}
                </Tag>
            );
        },
    },
    {
        title: 'Actions',
        key: 'actions',
        render: (_, row) => (
            <Flex align="center" gap={12}>
                <Button
                    type="text"
                    size="small"
                    className="flex items-center p-0"
                    onClick={() => onView(row.id)}
                    icon={<img src={viewIcon} alt="View" width={14} height={14} />}
                />
                {!['ACCEPTED', 'CONVERTED'].includes(row.status as string) && (
                    <>
                        <EditOutlined
                            className="text-[#A1A1AA] cursor-pointer hover:text-[#475569]"
                            onClick={() => onEdit(row.id)}
                        />
                        <DeleteOutlined
                            className="text-[#A1A1AA] cursor-pointer hover:text-red-500"
                            onClick={() => onDelete(row.id)}
                        />
                    </>
                )}
            </Flex>
        ),
    },
];

export default getQuotationColumns;
