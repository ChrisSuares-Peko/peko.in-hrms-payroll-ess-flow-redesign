import { Flex, Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';

import { GenericColumns } from '@components/atomic/GenericTable';

import { booksColumn, readOnlyBooks } from './BooksMarkCell';
import SlipLink from './SlipLink';
import {
    amountCell,
    entryNumberCell,
    formatDate,
    orderStatusPill,
    voidedNote,
} from './vendorColumns';
import { manualJournalPath } from '../../config/manualOperations';
import {
    PaymentGatewaySettlementEntry,
    PaymentGatewayTransactionEntry,
} from '../../types/paymentGatewayLedger';
import { PillMeta, formatInr } from '../../utils/commission';
import { postingColumn } from '../common/PostingCell';
import RecordedByCell from '../common/RecordedByCell';
import StatusPill from '../common/StatusPill';

export const settlementEntryPill = (row: {
    entryType: string;
    status: string;
    entryKind: string;
    deleted?: boolean;
}): PillMeta => {
    if (row.deleted) return { label: 'Deleted', tone: 'danger' };
    if (row.entryType === 'REVERSAL') return { label: 'Reversal', tone: 'neutral' };
    if (row.status === 'VOIDED') return { label: 'Reversed', tone: 'neutral' };
    if (row.entryKind === 'OPENING') return { label: 'Opening', tone: 'success' };
    return row.entryKind === 'FEE'
        ? { label: 'Charged', tone: 'neutral' }
        : { label: 'Received', tone: 'success' };
};

const signedAmountCell = (row: PaymentGatewaySettlementEntry) => (
    <span className={row.entryType === 'REVERSAL' ? 'text-red-600' : undefined}>
        {row.entryType === 'REVERSAL' ? `- ${formatInr(row.amount)}` : formatInr(row.amount)}
    </span>
);

// A receipt that fell short of what was expected says so on the row, so the charge the
// gateway kept is readable without opening the Bills table beside it.
const expectedCell = (row: PaymentGatewaySettlementEntry) => {
    if (row.expectedAmount === null) return '—';
    const shortfall = Math.round((row.expectedAmount - row.amount) * 100) / 100;
    return (
        <Flex vertical>
            <Typography.Text>{formatInr(row.expectedAmount)}</Typography.Text>
            {shortfall ? (
                <Typography.Text className="text-xs text-navTextColor">
                    {formatInr(shortfall)} kept as charges
                </Typography.Text>
            ) : null}
        </Flex>
    );
};

export const transactionColumns: ColumnsType<PaymentGatewayTransactionEntry> = [
    {
        title: 'Date',
        key: 'transactionDate',
        width: 150,
        // An order inside the opening figure says so, rather than looking like it should be
        // adding to the balance the card reports.
        render: (_, row) => (
            <Flex vertical>
                <Typography.Text>{formatDate(row.transactionDate)}</Typography.Text>
                {row.beforeOpening ? (
                    <Typography.Text className="text-xs text-navTextColor">
                        before opening
                    </Typography.Text>
                ) : null}
            </Flex>
        ),
    },
    { title: 'Txn ID', key: 'corporateTxnId', dataIndex: 'corporateTxnId', width: 170 },
    {
        title: 'Subscriber',
        key: 'subscriberName',
        width: 180,
        render: (_, row) => row.subscriberName || '—',
    },
    { title: 'Service', key: 'service', width: 160, render: (_, row) => row.service || '—' },
    {
        title: 'Method',
        key: 'paymentMode',
        width: 180,
        render: (_, row) => row.paymentMode || '—',
    },
    {
        title: 'Full Amount',
        key: 'totalAmount',
        width: 150,
        render: (_, row) => amountCell(row.totalAmount),
    },
    {
        title: 'Through Gateway',
        key: 'gatewayAmount',
        width: 160,
        render: (_, row) => amountCell(row.gatewayAmount),
    },
    {
        title: 'Status',
        key: 'status',
        width: 130,
        render: (_, row) => <StatusPill {...orderStatusPill(row.status)} />,
    },
    postingColumn<PaymentGatewayTransactionEntry>({
        linkTo: row => manualJournalPath(row.corporateTxnId),
    }),
];

export const receiptColumns = (
    actions: (row: PaymentGatewaySettlementEntry) => React.ReactNode,
    books: (row: PaymentGatewaySettlementEntry) => React.ReactNode = readOnlyBooks
): GenericColumns<PaymentGatewaySettlementEntry> => [
    { title: 'Date', key: 'entryDate', width: 130, render: (_, row) => formatDate(row.entryDate) },
    {
        title: 'Entry No.',
        key: 'entryNumber',
        width: 120,
        render: (_, row) => entryNumberCell(row.entryNumber),
    },
    {
        title: 'Reference',
        key: 'reference',
        width: 170,
        // The opening carries no reference, because nothing moved to give it one.
        render: (_, row) =>
            row.entryKind === 'OPENING' ? 'Opening balance' : row.reference || '—',
    },
    { title: 'Mode', key: 'mode', dataIndex: 'mode', width: 110 },
    { title: 'Received', key: 'amount', width: 150, render: (_, row) => signedAmountCell(row) },
    { title: 'Expected', key: 'expectedAmount', width: 170, render: (_, row) => expectedCell(row) },
    {
        title: 'Note',
        key: 'note',
        width: 200,
        render: (_, row) => (
            <Flex vertical>
                <Typography.Text>{row.note || '—'}</Typography.Text>
                {voidedNote(row)}
            </Flex>
        ),
    },
    { title: 'Slip', key: 'slip', width: 150, render: (_, row) => <SlipLink slip={row} /> },
    {
        title: 'Recorded By',
        key: 'recordedByName',
        width: 150,
        render: (_, row) => <RecordedByCell name={row.recordedByName} ipAddress={row.ipAddress} />,
    },
    {
        title: 'Status',
        key: 'status',
        width: 120,
        render: (_, row) => <StatusPill {...settlementEntryPill(row)} />,
    },
    booksColumn<PaymentGatewaySettlementEntry>(books),
    {
        title: 'Actions',
        key: 'actions',
        width: 170,
        neverFold: true,
        render: (_, row) => actions(row),
    },
];

export const feeColumns = (
    actions: (row: PaymentGatewaySettlementEntry) => React.ReactNode,
    books: (row: PaymentGatewaySettlementEntry) => React.ReactNode = readOnlyBooks
): GenericColumns<PaymentGatewaySettlementEntry> => [
    { title: 'Date', key: 'entryDate', width: 130, render: (_, row) => formatDate(row.entryDate) },
    {
        title: 'Entry No.',
        key: 'entryNumber',
        width: 120,
        render: (_, row) => entryNumberCell(row.entryNumber),
    },
    { title: 'Reference', key: 'reference', width: 160, render: (_, row) => row.reference || '—' },
    { title: 'Fee', key: 'amount', width: 150, render: (_, row) => signedAmountCell(row) },
    {
        title: 'Note',
        key: 'note',
        width: 220,
        render: (_, row) => (
            <Flex vertical>
                <Typography.Text>{row.note || '—'}</Typography.Text>
                {voidedNote(row)}
            </Flex>
        ),
    },
    {
        title: 'Recorded By',
        key: 'recordedByName',
        width: 150,
        render: (_, row) => <RecordedByCell name={row.recordedByName} ipAddress={row.ipAddress} />,
    },
    {
        title: 'Status',
        key: 'status',
        width: 120,
        render: (_, row) => <StatusPill {...settlementEntryPill(row)} />,
    },
    booksColumn<PaymentGatewaySettlementEntry>(books),
    {
        title: 'Actions',
        key: 'actions',
        width: 170,
        neverFold: true,
        render: (_, row) => actions(row),
    },
];

export const PAYMENT_GATEWAY_TAB_COPY: Record<
    string,
    { title: string; description: (name: string) => string }
> = {
    transactions: {
        title: 'Transactions',
        description: name =>
            `Every payment that passed through ${name}, subscriptions and ordinary orders alike. Full Amount is what the order was worth; Through Gateway is the part ${name} actually collected.`,
    },
    'received-and-bills': {
        title: 'Received & Bills',
        description: name =>
            `What ${name} has handed over, and what it kept as its charges. Both are recorded by hand, each as its own entry with its own date: the gateway's fee is not reported to Peko anywhere, so the accounts team records it from the gateway's statement under Bills.`,
    },
};
