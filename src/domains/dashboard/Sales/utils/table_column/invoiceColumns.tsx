import { Flex, Tag, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import markAsPaidIcon from '../../assets/icons/invoiceList/mark-as-paid.svg';
import viewIcon from '../../assets/icons/invoiceList/view.svg';
import { DocumentRow, InvoiceStatus } from '../../types/documents';
import { formatCurrency, formatDate, toTitleCase } from '../helperFunctions';

const STATUS_STYLE: Record<string, string> = {
    Paid: 'bg-[#ECFDF5] text-[#43B75D]',
    Pending: 'bg-[#FFF7ED] text-[#F97316]',
    Overdue: 'bg-[#FEF2F2] text-[#EF4444]',
    Partial: 'bg-[#EFF6FF] text-[#3B82F6]',
};

const getInvoiceColumns = (
    onEdit: (row: DocumentRow) => void,
    onDelete: (row: DocumentRow) => void,
    onView: (id: string) => void,
    statusFilter?: string[],
    onMarkAsPaid?: (row: DocumentRow) => void
): ColumnsType<DocumentRow> => [
    {
        title: 'Invoice ID',
        dataIndex: 'documentNumber',
        key: 'documentNumber',
        render: (documentNumber, record) => (
            <Typography.Text className="text-[#42526D] text-sm">
                {record.prefix ? `${record.prefix}${documentNumber}` : documentNumber}
            </Typography.Text>
        ),
    },
    {
        title: 'Customer',
        dataIndex: 'name',
        key: 'name',
        sorter: true,
        render: name => (
            <Typography.Text className="text-[#42526D] text-sm">{name}</Typography.Text>
        ),
    },
    {
        title: 'Date',
        dataIndex: 'createdAt',
        key: 'createdAt',
        sorter: true,
        render: createdAt => (
            <Typography.Text className="text-[#42526D] text-sm">
                {formatDate(createdAt)}
            </Typography.Text>
        ),
    },
    {
        title: 'Total Amount',
        dataIndex: 'totalAmount',
        key: 'totalAmount',
        width: 180,
        sorter: true,
        render: (totalAmount, record) => (
            <Typography.Text className="text-[#42526D] text-sm">
                {formatCurrency(Number(totalAmount), record.currency)}
            </Typography.Text>
        ),
    },
    {
        title: 'Amount Due',
        dataIndex: 'amountDue',
        key: 'amountDue',
        width: 180,
        sorter: true,
        render: (amountDue, record) => (
            <Typography.Text className="text-sm" style={{ color: '#ef4444' }}>
                {formatCurrency(Number(amountDue), record.currency)}
            </Typography.Text>
        ),
    },
    {
        title: 'Type',
        dataIndex: 'transactionType',
        key: 'transactionType',
        sorter: true,
        render: transactionType => (
            <Typography.Text className="text-[#42526D] text-sm">
                {toTitleCase(transactionType ?? '')}
            </Typography.Text>
        ),
    },
    {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        filteredValue: statusFilter ?? null,
        filters: [
            { text: 'Paid', value: 'Paid' },
            { text: 'Pending', value: 'Pending' },
            { text: 'Overdue', value: 'Overdue' },
            { text: 'Partial', value: 'Partial' },
        ],
        render: (status: InvoiceStatus) => {
            const key = status ? toTitleCase(status) : '';
            return (
                <Tag
                    className={`rounded-full text-xs font-medium border-0 px-3 py-1 ${STATUS_STYLE[key] ?? 'bg-[#F4F4F5] text-[#71717A]'}`}
                >
                    {key}
                </Tag>
            );
        },
    },
    {
        title: 'Actions',
        key: 'actions',
        render: (_, row) => {
            const isPaid = toTitleCase(row.status) === 'Paid';

            return (
                <Flex align="center" gap={16}>
                    <Tooltip title="View">
                        <button
                            type="button"
                            className="border-0 bg-transparent p-0 cursor-pointer flex items-center"
                            onClick={() => onView(row.id)}
                        >
                            <img src={viewIcon} alt="View" width={14} height={14} />
                        </button>
                    </Tooltip>
                    <Tooltip title={isPaid ? 'Already marked as paid' : 'Mark as paid'}>
                        <button
                            type="button"
                            disabled={isPaid}
                            className="border-0 bg-transparent p-0 flex items-center"
                            style={{
                                opacity: isPaid ? 0.35 : 1,
                                cursor: isPaid ? 'not-allowed' : 'pointer',
                            }}
                            onClick={() => !isPaid && onMarkAsPaid?.(row)}
                        >
                            <img src={markAsPaidIcon} alt="Mark as paid" width={14} height={14} />
                        </button>
                    </Tooltip>
                    {/* Edit/Delete temporarily disabled — an invoice with a credit note
                        against it must not be editable/deletable, and that guard isn't
                        wired up yet.
                    {!isPaid && (
                        <>
                            <Tooltip title="Edit">
                                <EditOutlined
                                    className="text-[#A1A1AA] cursor-pointer hover:text-[#475569] text-base"
                                    onClick={() => onEdit(row)}
                                />
                            </Tooltip>
                            <Tooltip title="Delete">
                                <DeleteOutlined
                                    className="text-[#A1A1AA] cursor-pointer hover:text-red-500 text-base"
                                    onClick={() => onDelete(row)}
                                />
                            </Tooltip>
                        </>
                    )} */}
                </Flex>
            );
        },
    },
];

export default getInvoiceColumns;
