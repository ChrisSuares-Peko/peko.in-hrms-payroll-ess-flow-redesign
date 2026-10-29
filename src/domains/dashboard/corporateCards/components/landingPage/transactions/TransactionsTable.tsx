import { EyeOutlined } from '@ant-design/icons';
import { Button, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/lib/table';

import GenericTable from '@components/atomic/GenericTable';
import { formatCompleteDate } from '@utils/dateFormat';

import { TxnApprovalTag, TxnStatusTag } from './TransactionStatusTag';
import { TransactionApprovalStatus, TransactionRow } from '../../../utils/types';
import CardThumb from '../../common/CardThumb';

const { Text } = Typography;

export type TransactionsVariant = 'admin' | 'user';

export interface TransactionApprovalHandlers {
    onApprove: (id: number) => void;
    onReject: (id: number) => void;
    /** Maps transaction id → the action currently in flight for that row. */
    pendingMap: Record<number, 'approve' | 'reject'>;
}

interface TransactionsTableProps {
    variant?: TransactionsVariant;
    onView: (txn: TransactionRow) => void;
    dataSource?: TransactionRow[];
    loading?: boolean;
    total?: number;
    page?: number;
    pageSize?: number;
    onPageChange?: (page: number) => void;
    hideActions?: boolean;
    approvalHandlers?: TransactionApprovalHandlers;
}

const formatSigned = (value: number): string =>
    value === 0
        ? '0'
        : `${value < 0 ? '-' : ''}₹${Math.abs(value).toLocaleString('en-IN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
          })}`;

const textCell = (value: string) => <Text className="text-sm text-textBody">{value}</Text>;

const buildColumns = (
    variant: TransactionsVariant,
    onView: TransactionsTableProps['onView'],
    hideActions: boolean,
    approvalHandlers?: TransactionApprovalHandlers
): ColumnsType<TransactionRow> => {
    const card = {
        key: 'card',
        title: 'Card',
        dataIndex: 'cardLast4',
        width: 220,
        render: (cardLast4: string) => (
            <div className="flex items-center gap-3">
                <CardThumb />
                <Text className="whitespace-nowrap text-sm text-textHeadings">{cardLast4}</Text>
            </div>
        ),
    };
    // The column stays date-only so the table reads cleanly; hovering reveals the time, which is what an
    // admin reconciling two charges on the same day actually needs.
    const date = {
        key: 'date',
        title: 'Date',
        dataIndex: 'date',
        width: 130,
        render: (value: string, row: TransactionRow) =>
            row.dateTime ? (
                <Tooltip title={formatCompleteDate(new Date(row.dateTime))}>
                    <Text className="cursor-help text-sm text-textBody">{value}</Text>
                </Tooltip>
            ) : (
                textCell(value)
            ),
    };
    const merchant = {
        key: 'merchant',
        title: 'Merchant',
        dataIndex: 'merchant',
        width: 190,
        render: (value: string) => <Text className="text-sm text-textHeadings">{value}</Text>,
    };
    const status = {
        key: 'status',
        title: 'Status',
        dataIndex: 'status',
        width: 120,
        // A decline is the one status the row cannot explain by itself, so the reason rides the pill.
        render: (_: TransactionRow['status'], row: TransactionRow) => (
            <TxnStatusTag
                status={row.status}
                tooltip={row.status === 'Declined' ? row.declineReason : undefined}
            />
        ),
    };
    const fee = {
        key: 'fee',
        title: 'Fee',
        dataIndex: 'fee',
        width: 110,
        render: (value: number) => (
            <Text className="whitespace-nowrap text-sm text-textBody">{formatSigned(value)}</Text>
        ),
    };
    const amount = {
        key: 'amount',
        title: 'Amount',
        dataIndex: 'amount',
        width: 130,
        render: (value: number) => (
            <Text className="whitespace-nowrap text-sm text-textHeadings">
                {formatSigned(value)}
            </Text>
        ),
    };
    const actions = {
        key: 'actions',
        title: 'Actions',
        dataIndex: 'key',
        width: 90,
        render: (_: string, row: TransactionRow) => (
            <Button
                type="text"
                aria-label={`View ${row.merchant} transaction`}
                icon={<EyeOutlined className="text-textBody" />}
                onClick={() => onView(row)}
            />
        ),
    };

    const approvalActions = approvalHandlers
        ? ({
              key: 'approvalActions',
              title: 'Actions',
              dataIndex: 'approval',
              width: 170,
              render: (approval: TransactionApprovalStatus, row: TransactionRow) => {
                  if (approval !== 'Pending') return <TxnApprovalTag approval={approval} />;
                  const txnId = Number(row.key);
                  const pending = approvalHandlers.pendingMap[txnId];
                  return (
                      <div className="flex gap-2">
                          <Button
                              danger
                              size="small"
                              loading={pending === 'reject'}
                              onClick={() => approvalHandlers.onReject(txnId)}
                          >
                              Reject
                          </Button>
                          <Button
                              type="primary"
                              size="small"
                              loading={pending === 'approve'}
                              onClick={() => approvalHandlers.onApprove(txnId)}
                          >
                              Approve
                          </Button>
                      </div>
                  );
              },
          } as ColumnsType<TransactionRow>[number])
        : null;

    if (variant === 'user') {
        const transactionId = {
            key: 'transactionId',
            title: 'Transaction ID',
            dataIndex: 'transactionId',
            width: 160,
            render: textCell,
        };
        const category = {
            key: 'category',
            title: 'Category',
            dataIndex: 'category',
            width: 150,
            render: textCell,
        };
        return hideActions
            ? [card, date, transactionId, merchant, category, status, amount]
            : [card, date, transactionId, merchant, category, status, amount, actions];
    }

    const member = {
        key: 'member',
        title: 'Member',
        dataIndex: 'member',
        width: 170,
        render: textCell,
    };
    const approval = {
        key: 'approval',
        title: 'Approval',
        dataIndex: 'approval',
        width: 150,
        render: (_: TransactionRow['approval'], row: TransactionRow) => (
            <TxnApprovalTag approval={row.approval} />
        ),
    };
    const policyReason = {
        key: 'policyReason',
        title: 'Policy reason',
        dataIndex: 'declineReason',
        width: 220,
        render: (value: TransactionRow['declineReason']) => (
            <Text className="text-sm text-textBody">{value || '–'}</Text>
        ),
    };
    if (approvalActions)
        return [card, date, merchant, member, status, policyReason, amount, approvalActions];
    return hideActions
        ? [card, date, merchant, member, status, approval, fee, amount]
        : [card, date, merchant, member, status, approval, fee, amount, actions];
};

/** Transactions list table — org-wide activity (admin) or the user's own charges (user). */
const TransactionsTable = ({
    variant = 'admin',
    onView,
    dataSource,
    loading,
    total,
    page,
    pageSize,
    onPageChange,
    hideActions = false,
    approvalHandlers,
}: TransactionsTableProps) => (
    <GenericTable
        columns={buildColumns(variant, onView, hideActions, approvalHandlers)}
        dataSource={dataSource ?? []}
        rowKey="key"
        loading={loading}
        className="-mt-3"
        {...(total !== undefined && onPageChange
            ? {
                  pagination: {
                      current: page,
                      pageSize,
                      total,
                      onChange: onPageChange,
                      showSizeChanger: false,
                  },
              }
            : {})}
    />
);

export default TransactionsTable;
