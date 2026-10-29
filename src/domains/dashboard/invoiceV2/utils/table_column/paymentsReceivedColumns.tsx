import { Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import { TABLE_HEADER_STYLE } from './invoiceColumns';
import { PAYMENT_MODE_OPTIONS } from '../../constants/settings';
import { PaymentsReceivedRow } from '../../types/paymentsReceived';
import { formatCurrencyAmount, formatDate } from '../helperFunctions';

export { TABLE_HEADER_STYLE };

const modeLabel = (value: string) =>
    PAYMENT_MODE_OPTIONS.find(o => o.value === value)?.label ?? value;

const getPaymentsReceivedColumns = (): ColumnsType<PaymentsReceivedRow> => [
    {
        title: 'Date',
        dataIndex: 'date',
        key: 'date',
        render: (date: string) => (
            <Typography.Text className="text-[#42526D] text-sm">{formatDate(date)}</Typography.Text>
        ),
    },
    {
        title: 'Invoice',
        dataIndex: 'invoiceNumber',
        key: 'invoiceNumber',
        render: (num, record) => (
            <Typography.Text className="text-[#42526D] text-sm font-medium">
                {record.prefix ? `${record.prefix}${num}` : num}
            </Typography.Text>
        ),
    },
    {
        title: 'Customer',
        dataIndex: 'customerName',
        key: 'customerName',
        render: (name: string) => (
            <Typography.Text className="text-[#42526D] text-sm">{name}</Typography.Text>
        ),
    },
    {
        title: 'Amount',
        dataIndex: 'amount',
        key: 'amount',
        align: 'right',
        render: (amount: string, record) => (
            <Typography.Text className="text-sm font-semibold" style={{ color: '#43B75D' }}>
                + {formatCurrencyAmount(amount, record.currency)}
            </Typography.Text>
        ),
    },
    {
        title: 'Mode',
        dataIndex: 'mode',
        key: 'mode',
        render: (mode: string) => (
            <Typography.Text className="text-[#42526D] text-sm">{modeLabel(mode)}</Typography.Text>
        ),
    },
    {
        title: 'Reference',
        dataIndex: 'referenceId',
        key: 'referenceId',
        render: (val?: string | null) => (
            <Typography.Text className="text-[#94A3B8] text-sm">{val || '—'}</Typography.Text>
        ),
    },
    {
        title: 'Receipt No.',
        dataIndex: 'receiptNo',
        key: 'receiptNo',
        render: (val?: string | null) => (
            <Typography.Text className="text-[#94A3B8] text-xs">{val || '—'}</Typography.Text>
        ),
    },
];

export default getPaymentsReceivedColumns;
