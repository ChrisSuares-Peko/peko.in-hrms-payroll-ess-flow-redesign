import type { CSSProperties } from 'react';

// import { DeleteOutlined, EditOutlined } from '@ant-design/icons'; // re-enable with Edit/Delete buttons below
import { Flex, Tag, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import markAsPaidIcon from '../../assets/icons/invoiceList/mark-as-paid.svg';
import viewIcon from '../../assets/icons/invoiceList/view.svg';
import recurringIcon from '../../assets/icons/recurring.svg';
import { STATUS_STYLE } from '../../constants/style';
import { InvoiceRow } from '../../types/invoice';
import { formatCurrencyAmount, formatDate, toTitleCase } from '../helperFunctions';

// toTitleCase only capitalizes the first letter — fine for single-word statuses like PAID,
// but it would render REFUNDED as the literal "Refunded" only by luck of having no underscore.
// Kept explicit for clarity since it's a Credit Note status shown alongside invoice statuses.
const STATUS_LABELS: Record<string, string> = {
    REFUNDED: 'Refunded',
};

export const TABLE_HEADER_STYLE: CSSProperties = {
    backgroundColor: '#FAFBFB',
    color: '#42526D',
    fontWeight: 600,
    fontSize: '14px',
    borderBottom: '1.24px solid #EAECF0',
};

const getInvoiceColumns = (
    onEdit: (row: InvoiceRow) => void,
    onDelete: (row: InvoiceRow) => void,
    onView: (id: string) => void,
    statusFilter?: string[],
    onMakeRecurring?: (row: InvoiceRow) => void,
    onMarkPaid?: (row: InvoiceRow) => void
): ColumnsType<InvoiceRow> => [
    {
        title: 'Invoice ID',
        dataIndex: 'invoiceNumber',
        key: 'invoiceNumber',
        render: (invoiceNumber, record) => (
            <Typography.Text className="text-[#42526D] text-sm">
                {record.prefix ? `${record.prefix}${invoiceNumber}` : invoiceNumber}
            </Typography.Text>
        ),
    },
    {
        title: 'Customer',
        dataIndex: 'name',
        key: 'name',
        sorter: true,
        render: (name, record) => (
            <Typography.Text className="text-[#42526D] text-sm">
                {name || (record.cashSale ? 'Cash Sale' : 'N/A')}
            </Typography.Text>
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
                {formatCurrencyAmount(record.originalTotalAmount ?? totalAmount, record.currency)}
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
                {formatCurrencyAmount(record.originalAmountDue ?? amountDue, record.currency)}
            </Typography.Text>
        ),
    },
    {
        title: 'Type',
        dataIndex: 'invoiceType',
        key: 'invoiceType',
        sorter: true,
        render: invoiceType => (
            <Typography.Text className="text-[#42526D] text-sm">
                {toTitleCase(invoiceType ?? '')}
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
            { text: 'Refund Due', value: 'Refund Due' },
            { text: 'Refunded', value: 'Refunded' },
        ],
        render: (status: InvoiceRow['status']) => {
            const key = status ? (STATUS_LABELS[status] ?? toTitleCase(status)) : '';
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
            const isPaid = ['PAID', 'REFUNDED'].includes(row.status as string);

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
                    <Tooltip
                        title={
                            !row.recurring?.id || row.recurring?.status === 'ENDED'
                                ? 'Make recurring'
                                : 'Already has an active recurring'
                        }
                    >
                        <button
                            type="button"
                            disabled={!(!row.recurring?.id || row.recurring?.status === 'ENDED')}
                            className="border-0 bg-transparent p-0 flex items-center"
                            style={{
                                opacity:
                                    !row.recurring?.id || row.recurring?.status === 'ENDED'
                                        ? undefined
                                        : 0.35,
                                cursor:
                                    !row.recurring?.id || row.recurring?.status === 'ENDED'
                                        ? 'pointer'
                                        : 'not-allowed',
                            }}
                            onClick={() =>
                                (!row.recurring?.id || row.recurring?.status === 'ENDED') &&
                                onMakeRecurring?.(row)
                            }
                        >
                            <img src={recurringIcon} alt="Recurring" width={14} height={14} />
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
                            onClick={() => !isPaid && onMarkPaid?.(row)}
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
                                    className="cursor-pointer"
                                    style={{ fontSize: 14, color: '#475569' }}
                                    onClick={() => onEdit(row)}
                                />
                            </Tooltip>
                            <Tooltip title="Delete">
                                <DeleteOutlined
                                    className="cursor-pointer"
                                    style={{ fontSize: 14, color: '#475569' }}
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
