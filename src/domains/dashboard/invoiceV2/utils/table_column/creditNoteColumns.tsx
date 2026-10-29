import { EyeOutlined } from '@ant-design/icons';
import { Button, Flex, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import { TABLE_HEADER_STYLE } from './invoiceColumns';
import CreditNoteStatusSelect from '../../components/creditNote/CreditNoteStatusSelect';
import { CreditNoteRow, CreditNoteStatus } from '../../types/creditNote';
import { CREDIT_NOTE_REASON_COLORS, CREDIT_NOTE_REASON_LABELS } from '../constants/creditNote';
import { formatCurrencyAmount, formatDate } from '../helperFunctions';

export { TABLE_HEADER_STYLE };

const getCreditNoteColumns = (
    onView: (id: string) => void,
    onUpdateStatus: (creditNoteId: string, status: CreditNoteStatus) => Promise<boolean>
): ColumnsType<CreditNoteRow> => [
    {
        title: 'CN Number',
        dataIndex: 'creditNoteNumber',
        key: 'creditNoteNumber',
        render: (num, record) => (
            <Typography.Text className="text-[#42526D] text-sm font-medium">
                {record.prefix ? `${record.prefix}${num}` : num}
            </Typography.Text>
        ),
    },
    {
        title: 'Linked Invoice',
        dataIndex: 'linkedInvoiceNumber',
        key: 'linkedInvoiceNumber',
        render: (num, record) =>
            num ? (
                <Typography.Text className="text-[#42526D] text-sm">
                    {record.linkedInvoicePrefix ? `${record.linkedInvoicePrefix}${num}` : num}
                </Typography.Text>
            ) : (
                <Typography.Text className="text-[#A1A1AA] text-sm">—</Typography.Text>
            ),
    },
    {
        title: 'Customer',
        dataIndex: 'customerName',
        key: 'customerName',
        render: (name, record) => (
            <Flex vertical gap={1}>
                <Typography.Text className="text-[#42526D] text-sm font-medium">
                    {name}
                </Typography.Text>
                {record.customerEmail && (
                    <Typography.Text className="text-[#94A3B8] text-xs">
                        {record.customerEmail}
                    </Typography.Text>
                )}
            </Flex>
        ),
    },
    {
        title: 'Reason',
        dataIndex: 'reason',
        key: 'reason',
        render: (reason: string, record) => (
            <Flex vertical gap={2}>
                <Typography.Text
                    className="text-sm font-medium"
                    style={{ color: CREDIT_NOTE_REASON_COLORS[reason] ?? '#71717A' }}
                >
                    {CREDIT_NOTE_REASON_LABELS[reason] ?? reason}
                </Typography.Text>
                {record.reasonDetail && (
                    <Typography.Text className="text-[#94A3B8] text-xs">
                        {record.reasonDetail}
                    </Typography.Text>
                )}
            </Flex>
        ),
    },
    {
        title: 'Issued',
        dataIndex: 'issueDate',
        key: 'issueDate',
        render: (date: string) => (
            <Typography.Text className="text-[#42526D] text-sm">{formatDate(date)}</Typography.Text>
        ),
    },
    {
        title: 'Amount Due',
        dataIndex: 'amountDue',
        key: 'amountDue',
        render: (amount, record) => (
            <Typography.Text className="text-[#42526D] text-sm font-medium">
                {formatCurrencyAmount(
                    record.originalAmountDue ??
                        record.originalTotalAmount ??
                        amount ??
                        record.totalAmount,
                    record.currency
                )}
            </Typography.Text>
        ),
    },
    {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (status: CreditNoteStatus, row) => (
            <CreditNoteStatusSelect
                creditNoteId={row.id}
                status={status}
                onChange={onUpdateStatus}
            />
        ),
    },
    {
        title: 'Actions',
        key: 'actions',
        render: (_, row) => (
            <Button size="small" icon={<EyeOutlined />} onClick={() => onView(row.id)}>
                View
            </Button>
        ),
    },
];

export default getCreditNoteColumns;
