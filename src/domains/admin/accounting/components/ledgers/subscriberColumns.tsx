import { ReactNode } from 'react';

import { Flex, Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';

import { GenericColumn } from '@components/atomic/GenericTable';

import { amountCell, formatDate, orderStatusPill } from './vendorColumns';
import { LEDGER_TABS, LedgerTabKey } from '../../config/ledgerPaths';
import { manualJournalPath } from '../../config/manualOperations';
import {
    SubscriberBillEntry,
    SubscriberBillKind,
    SubscriberTransactionEntry,
    SubscriberWalletEntry,
    SubscriberWalletMovementType,
} from '../../types/subscriberLedger';
import { PillMeta, PillTone, formatInr } from '../../utils/commission';
import { postingColumn } from '../common/PostingCell';
import StatusPill from '../common/StatusPill';

export const PEKO_DEFAULT_PARTNER = 'Peko (Default)';

export const partnerLabel = (partnerName: string | null) => partnerName || PEKO_DEFAULT_PARTNER;

export const subscriberDisplayName = (subscriber: {
    name: string | null;
    contactPersonName: string | null;
    username: string | null;
}) => subscriber.name || subscriber.contactPersonName || subscriber.username || '';

export const walletMismatchMessage = (difference: number) =>
    `The wallet balance and the wallet ledger differ by ${formatInr(Math.abs(difference))}. The wallet is ${
        difference > 0 ? 'above' : 'below'
    } what the ledger adds up to, so some movement reached the wallet without a ledger row.`;

const movementCell = (value: number | null) => (value ? formatInr(value) : '—');

const WALLET_MOVEMENT_TONES: Record<SubscriberWalletMovementType, PillTone> = {
    Purchase: 'neutral',
    Refund: 'success',
    Cashback: 'success',
    'Cashback reversal': 'warning',
    'Top-up': 'success',
    'Admin credit': 'success',
    'Admin withdrawal': 'warning',
};

export const walletMovementPill = (type: SubscriberWalletMovementType | null): PillMeta =>
    type ? { label: type, tone: WALLET_MOVEMENT_TONES[type] } : { label: 'Other', tone: 'neutral' };

const BILL_TONES: Record<SubscriberBillKind, PillTone> = {
    invoice: 'success',
    platformFeeInvoice: 'neutral',
};

export const billPill = (bill: Pick<SubscriberBillEntry, 'kind' | 'label'>): PillMeta => ({
    label: bill.label,
    tone: BILL_TONES[bill.kind] || 'neutral',
});

const transactionColumns: ColumnsType<SubscriberTransactionEntry> = [
    {
        title: 'Date',
        key: 'transactionDate',
        width: 130,
        render: (_, row) => formatDate(row.transactionDate),
    },
    { title: 'Reference', key: 'corporateTxnId', dataIndex: 'corporateTxnId', width: 160 },
    { title: 'Service', key: 'service', width: 190, render: (_, row) => row.service || '—' },
    {
        title: 'Order Amount',
        key: 'orderAmount',
        width: 140,
        render: (_, row) => amountCell(row.orderAmount),
    },
    {
        title: 'Discount',
        key: 'discount',
        width: 130,
        render: (_, row) => amountCell(row.discount),
    },
    {
        title: 'Paid from Wallet',
        key: 'paidFromWallet',
        width: 150,
        render: (_, row) => amountCell(row.paidFromWallet),
    },
    {
        title: 'Paid via Gateway',
        key: 'paidViaGateway',
        width: 150,
        render: (_, row) => amountCell(row.paidViaGateway),
    },
    {
        title: 'Status',
        key: 'status',
        width: 130,
        render: (_, row) => <StatusPill {...orderStatusPill(row.status)} />,
    },
    postingColumn<SubscriberTransactionEntry>({
        linkTo: row => manualJournalPath(row.corporateTxnId),
    }),
];

const walletColumns: ColumnsType<SubscriberWalletEntry> = [
    {
        title: 'Date',
        key: 'transactionDate',
        width: 130,
        render: (_, row) => formatDate(row.transactionDate),
    },
    {
        title: 'Reference',
        key: 'reference',
        width: 160,
        render: (_, row) => row.reference || '—',
    },
    {
        title: 'Type',
        key: 'type',
        width: 160,
        render: (_, row) => <StatusPill {...walletMovementPill(row.type)} />,
    },
    {
        title: 'Particulars',
        key: 'particulars',
        width: 260,
        render: (_, row) => (
            <Flex vertical>
                <Typography.Text>{row.particulars || '—'}</Typography.Text>
                {row.remark && (
                    <Typography.Text className="text-xs text-navTextColor">
                        {row.remark}
                    </Typography.Text>
                )}
            </Flex>
        ),
    },
    { title: 'Debit', key: 'debit', width: 140, render: (_, row) => movementCell(row.debit) },
    { title: 'Credit', key: 'credit', width: 140, render: (_, row) => movementCell(row.credit) },
    {
        title: 'Balance After',
        key: 'balanceAfter',
        width: 150,
        render: (_, row) => amountCell(row.balanceAfter),
    },
    postingColumn<SubscriberWalletEntry>({
        linkTo: row => (row.reference ? manualJournalPath(row.reference) : null),
    }),
];

const billColumns: ColumnsType<SubscriberBillEntry> = [
    {
        title: 'Date',
        key: 'transactionDate',
        width: 130,
        render: (_, row) => formatDate(row.transactionDate),
    },
    { title: 'Reference', key: 'corporateTxnId', dataIndex: 'corporateTxnId', width: 160 },
    { title: 'Service', key: 'service', width: 190, render: (_, row) => row.service || '—' },
    {
        title: 'Document',
        key: 'label',
        width: 180,
        render: (_, row) => <StatusPill {...billPill(row)} />,
    },
    {
        title: 'Document No.',
        key: 'documentNumber',
        width: 150,
        render: (_, row) => row.documentNumber || '—',
    },
    { title: 'Taxable', key: 'taxable', width: 130, render: (_, row) => amountCell(row.taxable) },
    { title: 'GST', key: 'gst', width: 120, render: (_, row) => amountCell(row.gst) },
    { title: 'Total', key: 'total', width: 130, render: (_, row) => amountCell(row.total) },
];

export const SUBSCRIBER_TAB_COPY: Partial<
    Record<LedgerTabKey, { title: string; description: (name: string) => string }>
> = {
    [LEDGER_TABS.transactions]: {
        title: 'Transactions',
        description: name =>
            `Every order placed by ${name}, including Peko plan and add-on payments, however it was paid, with refunds and failures. The payment receipt can be downloaded from the row where one was issued.`,
    },
    [LEDGER_TABS.wallet]: {
        title: 'Cashbacks & Rewards',
        description: name =>
            `Cashback earned and reversed for ${name}, with every other movement on the wallet: purchases paid from it, refunds into it, top-ups, and credits or withdrawals by the team.`,
    },
    [LEDGER_TABS.bills]: {
        title: 'Bills',
        description: name =>
            `Every invoice issued to ${name}: the invoice for what was bought, and the platform fee invoice where a platform fee was charged on top.`,
    },
};

export type SubscriberBillActions = (row: SubscriberBillEntry) => ReactNode;

export type SubscriberTransactionActions = (row: SubscriberTransactionEntry) => ReactNode;

const actionsColumn = <T,>(renderActions: (row: T) => ReactNode): GenericColumn<T> => ({
    title: 'Actions',
    key: 'actions',
    width: 200,
    neverFold: true,
    render: (_, row: T) => renderActions(row),
});

export const subscriberTabColumns = (
    tab: LedgerTabKey,
    renderBillActions?: SubscriberBillActions,
    renderTransactionActions?: SubscriberTransactionActions
) => {
    if (tab === LEDGER_TABS.wallet) return walletColumns;
    if (tab === LEDGER_TABS.bills) {
        return renderBillActions
            ? [...billColumns, actionsColumn<SubscriberBillEntry>(renderBillActions)]
            : billColumns;
    }
    return renderTransactionActions
        ? [
              ...transactionColumns,
              actionsColumn<SubscriberTransactionEntry>(renderTransactionActions),
          ]
        : transactionColumns;
};
