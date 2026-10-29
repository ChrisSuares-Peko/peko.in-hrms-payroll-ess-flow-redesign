import { Flex, Tag, Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

import { GenericColumns } from '@components/atomic/GenericTable';

import { booksColumn, readOnlyBooks } from './BooksMarkCell';
import SlipLink from './SlipLink';
import { LEDGER_TABS, LedgerTabKey } from '../../config/ledgerPaths';
import { manualJournalPath } from '../../config/manualOperations';
import { LedgerBooksMark } from '../../types/ledgerBooks';
import { Posting } from '../../types/posting';
import {
    VendorCommissionEntry,
    VendorCostOfSalesEntry,
    VendorCreditNoteEntry,
    VendorDebitNoteEntry,
    VendorDepositEntry,
    VendorEntrySource,
    VendorSellingMode,
    VendorTransactionEntry,
} from '../../types/vendorLedger';
import { PillMeta, formatInr } from '../../utils/commission';
import PostingCell, { postingColumn } from '../common/PostingCell';
import RecordedByCell from '../common/RecordedByCell';
import StatusPill from '../common/StatusPill';

export const formatDate = (value: string) => (value ? dayjs(value).format('DD MMM YYYY') : '—');

export const entryNumberCell = (value: string | null | undefined) =>
    value ? <span className="whitespace-nowrap">{value}</span> : '—';

export const amountCell = (value: number | null) =>
    value === null || value === undefined ? '—' : formatInr(value);

// A refund leaves the provider's own status behind, so the journal decides what the pill
// reads: anything with a refund on it is Refunded, never Failed.
export const orderStatusPill = (status: string | null, refunded = false): PillMeta => {
    if (refunded) return { label: 'Refunded', tone: 'neutral' };

    const value = (status || '').toUpperCase();
    if (value === 'SUCCESS' || value === 'ORDERED') return { label: 'Success', tone: 'success' };
    if (value === 'REFUND' || value === 'REFUNDED') return { label: 'Refunded', tone: 'neutral' };
    if (value === 'FAILED' || value === 'FAILURE') return { label: 'Failed', tone: 'warning' };
    return { label: status || 'Unknown', tone: 'neutral' };
};

// A commission is invoiced and its reversal credited; a credit note is the other way
// round. A row the ledger derived rather than stored can only be what its tab says.
export const taxDocumentLabel = (
    source: VendorEntrySource,
    entryType: string | null,
    creditNoteTab: boolean
) => {
    if (source !== 'MANUAL') return creditNoteTab ? 'Tax Credit Note' : 'Commission Invoice';
    if (creditNoteTab !== (entryType === 'REVERSAL')) return 'Tax Credit Note';
    return creditNoteTab ? 'Tax Invoice' : 'Commission Invoice';
};

export const entrySourcePill = (source: 'MANUAL' | 'AUTO'): PillMeta =>
    source === 'AUTO'
        ? { label: 'From refund', tone: 'neutral' }
        : { label: 'Manual', tone: 'success' };

export const depositEntryPill = (row: {
    entryType?: string;
    status: string;
    deleted?: boolean;
}): PillMeta => {
    if (row.deleted) return { label: 'Deleted', tone: 'danger' };
    if (row.entryType === 'REVERSAL') return { label: 'Reversal', tone: 'neutral' };
    if (row.status === 'VOIDED') return { label: 'Reversed', tone: 'neutral' };
    if (row.entryType === 'OPENING') return { label: 'Opening', tone: 'success' };
    return { label: 'Active', tone: 'success' };
};

// A manual commission and its reversal carry the same reference and amount, so the row
// has to say which one it is rather than leaving them to be told apart by their dates.
export const commissionEntryPill = (row: {
    source: VendorEntrySource;
    entryType: string | null;
    status: string | null;
    refunded: boolean;
    deleted?: boolean;
}): PillMeta => {
    if (row.source !== 'MANUAL') {
        return row.refunded
            ? { label: 'Refunded', tone: 'neutral' }
            : { label: 'Earned', tone: 'success' };
    }
    if (row.deleted) return { label: 'Deleted', tone: 'danger' };
    if (row.entryType === 'REVERSAL') return { label: 'Reversal', tone: 'neutral' };
    if (row.status === 'VOIDED') return { label: 'Reversed', tone: 'neutral' };
    return { label: 'Active', tone: 'success' };
};

export const entryStatusPill = (status: string): PillMeta => {
    if (status === 'VOIDED') return { label: 'Voided', tone: 'neutral' };
    if (status === 'APPLIED') return { label: 'Applied', tone: 'success' };
    if (status === 'OPEN') return { label: 'Open', tone: 'warning' };
    return { label: 'Credited', tone: 'success' };
};

export const SELLING_MODE_TAGS: Record<string, { label: string; color: string }> = {
    MARGIN: { label: 'Margin', color: 'blue' },
    AGENT_MARKUP: { label: 'Agent Markup', color: 'purple' },
    PRINCIPAL_MARKUP: { label: 'Principal Markup', color: 'gold' },
};

// A mixed order carries both of its modes; a sale on Peko's own account carries none.
export const sellingModeTags = (mode: VendorSellingMode | null | undefined) => {
    if (mode === 'MIXED') return [SELLING_MODE_TAGS.MARGIN, SELLING_MODE_TAGS.PRINCIPAL_MARKUP];
    const tag = mode ? SELLING_MODE_TAGS[mode] : undefined;
    return tag ? [tag] : [];
};

const SellingModeTags = ({ mode }: { mode: VendorSellingMode | null | undefined }) => {
    const tags = sellingModeTags(mode);
    if (!tags.length) return null;
    return (
        <Flex gap={4} wrap="wrap">
            {tags.map(tag => (
                <Tag key={tag.label} color={tag.color} className="m-0 text-[11px] leading-4">
                    {tag.label}
                </Tag>
            ))}
        </Flex>
    );
};

const transactionColumns: ColumnsType<VendorTransactionEntry> = [
    {
        title: 'Date',
        key: 'transactionDate',
        width: 120,
        render: (_, row) => formatDate(row.transactionDate),
    },
    {
        title: 'Reference',
        key: 'corporateTxnId',
        width: 170,
        render: (_, row) => (
            <Flex vertical gap={4}>
                <span>{row.corporateTxnId}</span>
                <SellingModeTags mode={row.commissionMode} />
            </Flex>
        ),
    },
    { title: 'Service', key: 'service', width: 150, render: (_, row) => row.service || '—' },
    { title: 'Customer', key: 'customer', width: 130, render: (_, row) => row.customer || '—' },
    {
        title: 'Vendor Amount',
        key: 'vendorAmount',
        width: 140,
        render: (_, row) => amountCell(row.vendorAmount),
    },
    {
        title: 'Commission (incl. VAT)',
        key: 'commission',
        width: 165,
        render: (_, row) => amountCell(row.commission),
    },
    { title: 'Markup', key: 'markup', width: 120, render: (_, row) => amountCell(row.markup) },
    {
        title: 'Payable',
        key: 'receivable',
        width: 130,
        render: (_, row) => amountCell(row.receivable),
    },
    {
        title: 'Status',
        key: 'status',
        width: 115,
        render: (_, row) => <StatusPill {...orderStatusPill(row.status, row.refunded)} />,
    },
    postingColumn<VendorTransactionEntry>({ linkTo: row => manualJournalPath(row.corporateTxnId) }),
];

// A reversal keeps its own positive amount on the row, so it is shown the way it lands on
// the balance: taken back off what was charged.
const signedCommission = (row: VendorCommissionEntry, value: number | null) => {
    if (value === null || value === undefined) return '—';
    return row.entryType === 'REVERSAL' ? (
        <span className="text-red-600">- {formatInr(value)}</span>
    ) : (
        formatInr(value)
    );
};

// A hand-recorded entry keeps its GST split on the row, so the table shows the taxable part, the
// GST and the total side by side; a reversal shows each of them taken back.
export const signedAmount = (negative: boolean, value: number | null | undefined) => {
    if (value === null || value === undefined) return '—';
    return negative ? <span className="text-red-600">- {formatInr(value)}</span> : formatInr(value);
};

type BooksOrPostingRow = LedgerBooksMark & { source: VendorEntrySource; posting?: Posting | null };

const booksOrPostingColumn = <T extends BooksOrPostingRow>(
    books: (row: T) => React.ReactNode,
    journalOf: (row: T) => string | null
) =>
    booksColumn<T>(
        row =>
            row.source === 'MANUAL' ? (
                books(row)
            ) : (
                <PostingCell posting={row.posting} to={journalOf(row)} />
            ),
        true,
        160
    );

const commissionColumns = (
    actions: (row: VendorCommissionEntry) => React.ReactNode,
    books: (row: VendorCommissionEntry) => React.ReactNode = readOnlyBooks
): GenericColumns<VendorCommissionEntry> => [
    {
        title: 'Date',
        key: 'transactionDate',
        width: 130,
        render: (_, row) => formatDate(row.transactionDate),
    },
    {
        title: 'Entry No.',
        key: 'entryNumber',
        width: 120,
        render: (_, row) => entryNumberCell(row.entryNumber),
    },
    {
        title: 'Order Ref',
        key: 'corporateTxnId',
        width: 150,
        render: (_, row) => row.corporateTxnId || row.againstCorporateTxnId || '—',
    },
    {
        title: 'Service',
        key: 'service',
        width: 150,
        render: (_, row) => row.service || row.reason || 'Recorded by hand',
    },
    {
        title: 'Order Value',
        key: 'orderAmount',
        width: 150,
        render: (_, row) => amountCell(row.orderAmount),
    },
    {
        title: 'Commission (excl. GST)',
        key: 'commissionExcludingGST',
        width: 160,
        render: (_, row) => signedCommission(row, row.commissionExcludingGST),
    },
    {
        title: 'GST',
        key: 'commissionGST',
        width: 120,
        render: (_, row) => signedCommission(row, row.commissionGST ?? null),
    },
    {
        title: 'Commission (incl. GST)',
        key: 'commissionIncludingGST',
        width: 160,
        render: (_, row) => signedCommission(row, row.commissionIncludingGST),
    },
    {
        title: 'Principal Markup',
        key: 'principalMarkup',
        width: 160,
        render: (_, row) => amountCell(row.principalMarkup ?? null),
    },
    {
        title: 'Reversed',
        key: 'commissionReversed',
        width: 130,
        render: (_, row) =>
            row.commissionReversed ? (
                <span className="text-red-600">- {formatInr(row.commissionReversed)}</span>
            ) : (
                '—'
            ),
    },
    {
        title: 'Net',
        key: 'commissionNet',
        width: 140,
        render: (_, row) => signedCommission(row, row.commissionNet),
    },
    {
        title: 'Source',
        key: 'source',
        width: 130,
        render: (_, row) =>
            row.source === 'MANUAL' ? (
                <StatusPill {...entrySourcePill('MANUAL')} />
            ) : (
                <StatusPill label="Order" tone="neutral" />
            ),
    },
    {
        title: 'Status',
        key: 'status',
        width: 130,
        render: (_, row) => (
            <Flex vertical gap={2}>
                <StatusPill {...commissionEntryPill(row)} />
                {row.entryType === 'REVERSAL' && row.reference ? (
                    <Typography.Text className="text-xs text-navTextColor">
                        Reverses {row.reference}
                    </Typography.Text>
                ) : null}
            </Flex>
        ),
    },
    {
        title: 'Recorded By',
        key: 'recordedByName',
        width: 150,
        render: (_, row) => <RecordedByCell name={row.recordedByName} ipAddress={row.ipAddress} />,
    },
    booksOrPostingColumn<VendorCommissionEntry>(books, row =>
        row.corporateTxnId ? manualJournalPath(row.corporateTxnId) : null
    ),
    {
        title: 'Actions',
        key: 'actions',
        width: 210,
        neverFold: true,
        render: (_, row) => actions(row),
    },
];

type NotedRow = {
    voidedByName: string | null;
    voidReason: string | null;
    deleted?: boolean;
    deleteReason?: string | null;
    deletedByName?: string | null;
};

export const voidedNote = (row: NotedRow) => {
    if (row.deleted) {
        return (
            <Typography.Text className="text-xs text-red-600">
                Deleted{row.deleteReason ? `: ${row.deleteReason}` : ''}
                {row.deletedByName ? ` · ${row.deletedByName}` : ''}
            </Typography.Text>
        );
    }
    return row.voidReason ? (
        <Typography.Text className="text-xs text-navTextColor">
            {row.voidReason}
            {row.voidedByName ? ` · ${row.voidedByName}` : ''}
        </Typography.Text>
    ) : null;
};

export const depositColumns = (
    actions: (row: VendorDepositEntry) => React.ReactNode,
    books: (row: VendorDepositEntry) => React.ReactNode = readOnlyBooks
): GenericColumns<VendorDepositEntry> => [
    {
        title: 'Date',
        key: 'depositDate',
        width: 130,
        render: (_, row) => formatDate(row.depositDate),
    },
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
        render: (_, row) =>
            row.entryType === 'OPENING' ? 'Opening balance' : row.reference || '—',
    },
    { title: 'Mode', key: 'mode', dataIndex: 'mode', width: 110 },
    {
        title: 'Amount',
        key: 'amount',
        width: 150,
        render: (_, row) => (
            <span className={row.entryType === 'REVERSAL' ? 'text-red-600' : undefined}>
                {row.entryType === 'REVERSAL'
                    ? `- ${formatInr(row.amount)}`
                    : formatInr(row.amount)}
            </span>
        ),
    },
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
    {
        title: 'Slip',
        key: 'slip',
        width: 150,
        render: (_, row) => <SlipLink slip={row} />,
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
        render: (_, row) => <StatusPill {...depositEntryPill(row)} />,
    },
    booksColumn<VendorDepositEntry>(books),
    {
        title: 'Actions',
        key: 'actions',
        width: 170,
        neverFold: true,
        render: (_, row) => actions(row),
    },
];

// Only a manual reversal is a deduction; the commission that came back on a refund is shown as it is.
const isCreditNoteDeduction = (row: VendorCreditNoteEntry) =>
    row.source === 'MANUAL' && row.entryType === 'REVERSAL';

export const creditNoteColumns = (
    actions: (row: VendorCreditNoteEntry) => React.ReactNode,
    books: (row: VendorCreditNoteEntry) => React.ReactNode = readOnlyBooks
): GenericColumns<VendorCreditNoteEntry> => [
    { title: 'Date', key: 'issueDate', width: 130, render: (_, row) => formatDate(row.issueDate) },
    {
        title: 'Entry No.',
        key: 'entryNumber',
        width: 120,
        render: (_, row) => entryNumberCell(row.entryNumber),
    },
    {
        title: 'Against Order',
        key: 'againstCorporateTxnId',
        width: 160,
        render: (_, row) => row.againstCorporateTxnId || '—',
    },
    {
        title: 'Reason',
        key: 'reason',
        width: 200,
        render: (_, row) => (
            <Flex vertical>
                <Typography.Text>{row.reason || '—'}</Typography.Text>
                {voidedNote(row)}
            </Flex>
        ),
    },
    {
        title: 'Taxable Amount',
        key: 'taxableAmount',
        width: 150,
        render: (_, row) => signedAmount(isCreditNoteDeduction(row), row.taxableAmount),
    },
    {
        title: 'GST',
        key: 'gstAmount',
        width: 120,
        render: (_, row) => signedAmount(isCreditNoteDeduction(row), row.gstAmount),
    },
    {
        title: 'Total (incl. GST)',
        key: 'amount',
        width: 160,
        render: (_, row) => signedAmount(isCreditNoteDeduction(row), row.amount),
    },
    {
        title: 'Source',
        key: 'source',
        width: 140,
        render: (_, row) => <StatusPill {...entrySourcePill(row.source)} />,
    },
    {
        title: 'Document',
        key: 'slip',
        width: 150,
        render: (_, row) => <SlipLink slip={row} />,
    },
    {
        title: 'Status',
        key: 'status',
        width: 120,
        render: (_, row) => <StatusPill {...depositEntryPill(row)} />,
    },
    {
        title: 'Recorded By',
        key: 'recordedByName',
        width: 150,
        render: (_, row) => <RecordedByCell name={row.recordedByName} ipAddress={row.ipAddress} />,
    },
    booksOrPostingColumn<VendorCreditNoteEntry>(books, row => manualJournalPath(row.reference)),
    {
        title: 'Actions',
        key: 'actions',
        width: 230,
        neverFold: true,
        render: (_, row) => actions(row),
    },
];

export const costOfSalesColumns = (
    actions: (row: VendorCostOfSalesEntry) => React.ReactNode,
    books: (row: VendorCostOfSalesEntry) => React.ReactNode = readOnlyBooks
): GenericColumns<VendorCostOfSalesEntry> => [
    { title: 'Date', key: 'issueDate', width: 130, render: (_, row) => formatDate(row.issueDate) },
    {
        title: 'Entry No.',
        key: 'entryNumber',
        width: 120,
        render: (_, row) => entryNumberCell(row.entryNumber),
    },
    {
        title: 'Against Order',
        key: 'againstCorporateTxnId',
        width: 160,
        render: (_, row) => row.againstCorporateTxnId || '—',
    },
    {
        title: 'Reason',
        key: 'reason',
        width: 200,
        render: (_, row) => (
            <Flex vertical>
                <Typography.Text>{row.reason || '—'}</Typography.Text>
                {voidedNote(row)}
            </Flex>
        ),
    },
    {
        title: 'Taxable Amount',
        key: 'taxableAmount',
        width: 150,
        render: (_, row) => signedAmount(row.entryType === 'REVERSAL', row.taxableAmount),
    },
    {
        title: 'GST',
        key: 'gstAmount',
        width: 120,
        render: (_, row) => signedAmount(row.entryType === 'REVERSAL', row.gstAmount),
    },
    {
        title: 'Total (incl. GST)',
        key: 'amount',
        width: 160,
        render: (_, row) => signedAmount(row.entryType === 'REVERSAL', row.amount),
    },
    {
        title: 'Document',
        key: 'slip',
        width: 150,
        render: (_, row) => <SlipLink slip={row} />,
    },
    {
        title: 'Status',
        key: 'status',
        width: 120,
        render: (_, row) => <StatusPill {...depositEntryPill(row)} />,
    },
    {
        title: 'Recorded By',
        key: 'recordedByName',
        width: 150,
        render: (_, row) => <RecordedByCell name={row.recordedByName} ipAddress={row.ipAddress} />,
    },
    booksColumn<VendorCostOfSalesEntry>(books),
    {
        title: 'Actions',
        key: 'actions',
        width: 170,
        neverFold: true,
        render: (_, row) => actions(row),
    },
];

export const debitNoteColumns = (
    actions: (row: VendorDebitNoteEntry) => React.ReactNode,
    books: (row: VendorDebitNoteEntry) => React.ReactNode = readOnlyBooks
): GenericColumns<VendorDebitNoteEntry> => [
    { title: 'Date', key: 'issueDate', width: 130, render: (_, row) => formatDate(row.issueDate) },
    {
        title: 'Entry No.',
        key: 'entryNumber',
        width: 120,
        render: (_, row) => entryNumberCell(row.entryNumber),
    },
    {
        title: 'Against Order',
        key: 'againstCorporateTxnId',
        width: 160,
        render: (_, row) => row.againstCorporateTxnId || '—',
    },
    {
        title: 'Reason',
        key: 'reason',
        width: 200,
        render: (_, row) => (
            <Flex vertical>
                <Typography.Text>{row.reason || '—'}</Typography.Text>
                {voidedNote(row)}
            </Flex>
        ),
    },
    {
        title: 'Taxable Amount',
        key: 'taxableAmount',
        width: 150,
        render: (_, row) => signedAmount(row.entryType === 'REVERSAL', row.taxableAmount),
    },
    {
        title: 'GST',
        key: 'gstAmount',
        width: 120,
        render: (_, row) => signedAmount(row.entryType === 'REVERSAL', row.gstAmount),
    },
    {
        title: 'Total (incl. GST)',
        key: 'amount',
        width: 160,
        render: (_, row) => signedAmount(row.entryType === 'REVERSAL', row.amount),
    },
    {
        title: 'Document',
        key: 'slip',
        width: 150,
        render: (_, row) => <SlipLink slip={row} />,
    },
    {
        title: 'Status',
        key: 'status',
        width: 120,
        render: (_, row) => <StatusPill {...depositEntryPill(row)} />,
    },
    {
        title: 'Recorded By',
        key: 'recordedByName',
        width: 150,
        render: (_, row) => <RecordedByCell name={row.recordedByName} ipAddress={row.ipAddress} />,
    },
    booksColumn<VendorDebitNoteEntry>(books),
    {
        title: 'Actions',
        key: 'actions',
        width: 170,
        neverFold: true,
        render: (_, row) => actions(row),
    },
];

export const VENDOR_TAB_COPY: Record<
    string,
    { title: string; description: (name: string) => string }
> = {
    [LEDGER_TABS.transactions]: {
        title: 'Transactions',
        description: name =>
            `Orders processed for ${name}, including refunds and failures, each tagged by how it was sold: Margin, Agent Markup or Principal Markup. Orders sold on a markup basis are listed at ${name}’s price with Peko’s markup before GST beside them, but they never come out of the advance: ${name} bills Peko for them and the bill is recorded as cost of sales. Peko’s own service subscriptions such as Peko Commerce are not listed.`,
    },
    [LEDGER_TABS.commissions]: {
        title: 'Commissions',
        description: name =>
            `Commission Peko earned on ${name} orders, net of whatever came back with a refund. Sales made as principal earn no commission and are not listed.`,
    },
    [LEDGER_TABS.costOfSales]: {
        title: 'Cost of Sales',
        description: name =>
            `Cost of sales recorded by hand for ${name}: the mirror of a commission recorded by hand, and where ${name}’s bills for orders sold on a markup basis are recorded. Each entry comes out of the advance like an order or a credit note and sits on the credit side of the statement; it is counted in Total Transaction, never in Commission earned. A wrong entry is put right with a debit note.`,
    },
    [LEDGER_TABS.debitNotes]: {
        title: 'Debit Notes',
        description: name =>
            `Debit notes raised on ${name} by hand: the mirror of a cost of sales. Each puts money back into the advance and sits on the debit side of the statement, and comes off Total Transaction.`,
    },
    [LEDGER_TABS.deposits]: {
        title: 'Deposits',
        description: name => `Prepaid deposits recorded for ${name}.`,
    },
    [LEDGER_TABS.creditNotes]: {
        title: 'Credit Notes',
        description: name =>
            `Credit notes issued by ${name}, and the commission that came back on every refund.`,
    },
};

export type VendorBooksRenderers = {
    deposit?: (row: VendorDepositEntry) => React.ReactNode;
    creditNote?: (row: VendorCreditNoteEntry) => React.ReactNode;
    commission?: (row: VendorCommissionEntry) => React.ReactNode;
    costOfSales?: (row: VendorCostOfSalesEntry) => React.ReactNode;
    debitNote?: (row: VendorDebitNoteEntry) => React.ReactNode;
};

export const vendorTabColumns = (
    tab: LedgerTabKey,
    depositActions: (row: VendorDepositEntry) => React.ReactNode,
    creditNoteActions: (row: VendorCreditNoteEntry) => React.ReactNode,
    commissionActions: (row: VendorCommissionEntry) => React.ReactNode,
    costOfSalesActions: (row: VendorCostOfSalesEntry) => React.ReactNode,
    debitNoteActions: (row: VendorDebitNoteEntry) => React.ReactNode,
    books: VendorBooksRenderers = {}
) => {
    if (tab === LEDGER_TABS.commissions)
        return commissionColumns(commissionActions, books.commission);
    if (tab === LEDGER_TABS.costOfSales)
        return costOfSalesColumns(costOfSalesActions, books.costOfSales);
    if (tab === LEDGER_TABS.debitNotes) return debitNoteColumns(debitNoteActions, books.debitNote);
    if (tab === LEDGER_TABS.deposits) return depositColumns(depositActions, books.deposit);
    if (tab === LEDGER_TABS.creditNotes)
        return creditNoteColumns(creditNoteActions, books.creditNote);
    return transactionColumns;
};
