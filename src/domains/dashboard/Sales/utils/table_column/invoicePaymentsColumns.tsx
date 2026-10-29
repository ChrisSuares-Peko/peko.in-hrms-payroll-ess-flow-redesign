import { EyeOutlined } from '@ant-design/icons';
import { Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import { PAYMENT_METHODS } from '../../constants';
import { InvoicePaymentRow } from '../../types/CollectPayment';
import { formatCurrency, formatDate } from '../helperFunctions';

const methodLabel = (value: string) =>
    PAYMENT_METHODS.find(o => o.value === value)?.label ?? value;

const getInvoicePaymentsColumns = (
    onView: (row: InvoicePaymentRow) => void
): ColumnsType<InvoicePaymentRow> => [
    {
        title: 'Invoice Date',
        dataIndex: 'invoiceDate',
        key: 'invoiceDate',
        sorter: true,
        render: (val: string) => (
            <Typography.Text className="text-[#42526D] text-sm">{formatDate(val)}</Typography.Text>
        ),
    },
    {
        title: 'Invoice Number',
        dataIndex: 'invoiceNumber',
        key: 'invoiceNumber',
        render: (val: string, record) => (
            <Typography.Text className="text-[#42526D] text-sm">
                {record.prefix ? `${record.prefix}${val}` : val}
            </Typography.Text>
        ),
    },
    {
        title: 'Total Amount',
        dataIndex: 'totalAmount',
        key: 'totalAmount',
        render: (val: string, record) => (
            <Typography.Text className="text-[#42526D] text-sm">
                {formatCurrency(Number(val), record.currency)}
            </Typography.Text>
        ),
    },
    {
        title: 'Paid Amount',
        dataIndex: 'amount',
        key: 'amount',
        sorter: true,
        render: (val: string, record) => (
            <Typography.Text className="text-[#42526D] text-sm font-medium">
                {formatCurrency(Number(val), record.currency)}
            </Typography.Text>
        ),
    },
    {
        title: 'Payment Date',
        dataIndex: 'paymentDate',
        key: 'paymentDate',
        sorter: true,
        render: (val: string) => (
            <Typography.Text className="text-[#42526D] text-sm">{formatDate(val)}</Typography.Text>
        ),
    },
    {
        title: 'Payment Method',
        dataIndex: 'paymentMethod',
        key: 'paymentMethod',
        render: (val: string) => (
            <Typography.Text className="text-sm font-medium text-green-600">
                {methodLabel(val)}
            </Typography.Text>
        ),
    },
    {
        title: 'Actions',
        key: 'actions',
        render: (_, record) => (
            <EyeOutlined
                className="text-[#A1A1AA] cursor-pointer hover:text-[#475569]"
                onClick={() => onView(record)}
            />
        ),
    },
];

export default getInvoicePaymentsColumns;
