import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Flex, Tag, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import viewIcon from '../../assets/icons/invoiceList/view.svg';
import { DocumentRow, QuotationStatus } from '../../types/documents';
import { formatCurrency, formatDate, toTitleCase } from '../helperFunctions';

const STATUS_STYLE: Record<string, string> = {
    Accepted: 'bg-[#ECFDF5] text-[#43B75D]',
    Rejected: 'bg-[#FEF2F2] text-[#EF4444]',
    Pending: 'bg-[#FFF7ED] text-[#F97316]',
};

const getQuotationColumns = (
    onEdit: (row: DocumentRow) => void,
    onDelete: (row: DocumentRow) => void,
    onView: (id: string) => void,
    statusFilter?: string[]
): ColumnsType<DocumentRow> => [
    {
        title: 'Quotation ID',
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
        title: 'Amount',
        dataIndex: 'totalAmount',
        key: 'totalAmount',
        sorter: true,
        render: (totalAmount, record) => (
            <Typography.Text className="text-[#42526D] text-sm">
                {formatCurrency(Number(totalAmount), record.currency)}
            </Typography.Text>
        ),
    },
    {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        filteredValue: statusFilter ?? null,
        filters: [
            { text: 'Accepted', value: 'Accepted' },
            { text: 'Rejected', value: 'Rejected' },
            { text: 'Pending', value: 'Pending' },
        ],
        render: (status: QuotationStatus) => {
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
        render: (_, row) => (
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
                {row.status !== 'ACCEPTED' && (
                    <>
                        <Tooltip title="Edit">
                            <EditOutlined
                                className="text-[#A1A1AA] cursor-pointer hover:text-[#475569]"
                                onClick={() => onEdit(row)}
                            />
                        </Tooltip>
                        <Tooltip title="Delete">
                            <DeleteOutlined
                                className="text-[#A1A1AA] cursor-pointer hover:text-red-500"
                                onClick={() => onDelete(row)}
                            />
                        </Tooltip>
                    </>
                )}
            </Flex>
        ),
    },
];

export default getQuotationColumns;
