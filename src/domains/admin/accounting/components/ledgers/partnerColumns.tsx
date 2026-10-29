import { Flex, Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';

import { GenericColumns } from '@components/atomic/GenericTable';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { booksColumn, readOnlyBooks } from './BooksMarkCell';
import SlipLink from './SlipLink';
import {
    amountCell,
    entryNumberCell,
    formatDate,
    orderStatusPill,
    signedAmount,
    voidedNote,
} from './vendorColumns';
import { LEDGER_TABS, LedgerTabKey } from '../../config/ledgerPaths';
import { manualJournalPath } from '../../config/manualOperations';
import {
    PartnerDebitNoteEntry,
    PartnerPayoutEntry,
    PartnerSubscriptionEntry,
    PartnerTransactionEntry,
} from '../../types/partnerLedger';
import { PillMeta, formatInr } from '../../utils/commission';
import { postingColumn } from '../common/PostingCell';
import RecordedByCell from '../common/RecordedByCell';
import StatusPill from '../common/StatusPill';

export const payoutEntryPill = (row: {
    entryType: string;
    status: string;
    entryKind?: string;
    deleted?: boolean;
}): PillMeta => {
    if (row.deleted) return { label: 'Deleted', tone: 'danger' };
    if (row.entryType === 'REVERSAL') return { label: 'Reversal', tone: 'neutral' };
    if (row.status === 'VOIDED') return { label: 'Reversed', tone: 'neutral' };
    if (row.entryKind === 'OPENING') return { label: 'Opening', tone: 'success' };
    return { label: 'Paid', tone: 'success' };
};

export const debitNoteEntryPill = (row: {
    entryType: string;
    status: string;
    deleted?: boolean;
}): PillMeta => {
    if (row.deleted) return { label: 'Deleted', tone: 'danger' };
    if (row.entryType === 'REVERSAL') return { label: 'Reversal', tone: 'neutral' };
    if (row.status === 'VOIDED') return { label: 'Reversed', tone: 'neutral' };
    return { label: 'Active', tone: 'success' };
};

export const subscriptionKindPill = (addOn: boolean): PillMeta =>
    addOn ? { label: 'Add-on', tone: 'neutral' } : { label: 'Plan', tone: 'success' };

type CouponRow = {
    couponTotal: number | null;
};

const couponCell = (row: CouponRow) =>
    row.couponTotal ? <span className="text-red-600">- {formatInr(row.couponTotal)}</span> : '—';

// The rate a partner is on changes, so the row shows the one that actually applied to it,
// derived from the money the journal recorded rather than from the partner's rate today.
const sharePercentCell = (value: number | null) =>
    value === null || value === undefined ? '—' : `${formatNumberWithLocalString(value)} %`;

// The headline is what Peko owes, which carries GST on the fee, so it is never the
// percentage times anything on the row. Naming both parts is what makes the arithmetic
// close: base x rate is the fee, plus the GST beside it is the headline.
const shareCell = (row: {
    partnerShare: number | null;
    shareExcludingGST: number | null;
    shareGST: number | null;
}) => {
    if (row.partnerShare === null) return '—';
    return (
        <Flex vertical>
            <Typography.Text>{formatInr(row.partnerShare)}</Typography.Text>
            {row.shareExcludingGST !== null && row.shareGST !== null ? (
                <Typography.Text className="text-xs text-navTextColor">
                    {formatInr(row.shareExcludingGST)} + {formatInr(row.shareGST)} GST
                </Typography.Text>
            ) : null}
        </Flex>
    );
};

const transactionColumns: ColumnsType<PartnerTransactionEntry> = [
    {
        title: 'Date',
        key: 'transactionDate',
        width: 130,
        render: (_, row) => formatDate(row.transactionDate),
    },
    { title: 'Txn ID', key: 'corporateTxnId', dataIndex: 'corporateTxnId', width: 150 },
    {
        title: 'Subscriber',
        key: 'subscriberName',
        width: 150,
        render: (_, row) => row.subscriberName || '—',
    },
    { title: 'Service', key: 'service', width: 140, render: (_, row) => row.service || '—' },
    {
        title: 'Full Amount',
        key: 'totalAmount',
        width: 130,
        render: (_, row) => amountCell(row.totalAmount),
    },
    {
        title: 'Net Platform Fee',
        key: 'netPlatformFee',
        width: 130,
        render: (_, row) => amountCell(row.netPlatformFee),
    },
    {
        title: 'Net Commission',
        key: 'netCommission',
        width: 130,
        render: (_, row) => amountCell(row.netCommission),
    },
    { title: 'Coupon', key: 'coupon', width: 130, render: (_, row) => couponCell(row) },
    {
        title: 'Gateway Charge',
        key: 'gatewayCharge',
        width: 130,
        render: (_, row) => amountCell(row.gatewayCharge),
    },
    {
        title: 'Share Base',
        key: 'shareBase',
        width: 130,
        render: (_, row) => amountCell(row.shareBase),
    },
    {
        title: 'Share Applied',
        key: 'sharePercentageApplied',
        width: 120,
        render: (_, row) => sharePercentCell(row.sharePercentageApplied),
    },
    { title: 'Partner Share', key: 'partnerShare', width: 170, render: (_, row) => shareCell(row) },
    {
        title: 'Status',
        key: 'status',
        width: 120,
        render: (_, row) => <StatusPill {...orderStatusPill(row.status)} />,
    },
    postingColumn<PartnerTransactionEntry>({
        linkTo: row => manualJournalPath(row.corporateTxnId),
    }),
];

const subscriptionColumns: ColumnsType<PartnerSubscriptionEntry> = [
    {
        title: 'Date',
        key: 'transactionDate',
        width: 130,
        render: (_, row) => formatDate(row.transactionDate),
    },
    { title: 'Txn ID', key: 'corporateTxnId', dataIndex: 'corporateTxnId', width: 160 },
    {
        title: 'Subscriber',
        key: 'subscriberName',
        width: 160,
        render: (_, row) => row.subscriberName || '—',
    },
    { title: 'Plan', key: 'planName', width: 160, render: (_, row) => row.planName || '—' },
    {
        title: 'Billing',
        key: 'billingType',
        width: 120,
        render: (_, row) => row.billingType || '—',
    },
    {
        title: 'Kind',
        key: 'addOn',
        width: 110,
        render: (_, row) => <StatusPill {...subscriptionKindPill(row.addOn)} />,
    },
    {
        title: 'Amount (incl. GST)',
        key: 'totalAmount',
        width: 160,
        render: (_, row) => amountCell(row.totalAmount),
    },
    { title: 'Coupon', key: 'coupon', width: 140, render: (_, row) => couponCell(row) },
    {
        title: 'Gateway Charge',
        key: 'gatewayCharge',
        width: 140,
        render: (_, row) => amountCell(row.gatewayCharge),
    },
    {
        title: 'Share Base',
        key: 'shareBase',
        width: 150,
        render: (_, row) => amountCell(row.shareBase),
    },
    {
        title: 'Share Applied',
        key: 'sharePercentageApplied',
        width: 130,
        render: (_, row) => sharePercentCell(row.sharePercentageApplied),
    },
    { title: 'Partner Share', key: 'partnerShare', width: 180, render: (_, row) => shareCell(row) },
    {
        title: 'Net Revenue (excl. GST)',
        key: 'netRevenue',
        width: 180,
        render: (_, row) => amountCell(row.netRevenue),
    },
    {
        title: 'Status',
        key: 'status',
        width: 130,
        render: (_, row) => <StatusPill {...orderStatusPill(row.status)} />,
    },
    postingColumn<PartnerSubscriptionEntry>({
        linkTo: row => manualJournalPath(row.corporateTxnId),
    }),
];

// A payout that differed from the suggestion says so on the row, so an underpayment is
// visible rather than only showing up later as a balance that did not clear.
const suggestionCell = (row: PartnerPayoutEntry) => {
    if (row.calculatedAmount === null) return '—';
    return (
        <Flex vertical>
            <Typography.Text>{formatInr(row.calculatedAmount)}</Typography.Text>
            {row.difference ? (
                <Typography.Text
                    className={`text-xs ${row.difference < 0 ? 'text-amber-700' : 'text-navTextColor'}`}
                >
                    {row.difference < 0 ? 'Short by ' : 'Over by '}
                    {formatInr(Math.abs(row.difference))}
                </Typography.Text>
            ) : null}
        </Flex>
    );
};

export const payoutColumns = (
    actions: (row: PartnerPayoutEntry) => React.ReactNode,
    books: (row: PartnerPayoutEntry) => React.ReactNode = readOnlyBooks
): GenericColumns<PartnerPayoutEntry> => [
    {
        title: 'Date',
        key: 'payoutDate',
        width: 130,
        render: (_, row) => formatDate(row.payoutDate),
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
        // The opening carries no reference, because nothing moved to give it one.
        render: (_, row) =>
            row.entryKind === 'OPENING' ? 'Opening balance' : row.reference || '—',
    },
    { title: 'Mode', key: 'mode', dataIndex: 'mode', width: 110 },
    {
        title: 'Paid',
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
        title: 'Calculated',
        key: 'calculatedAmount',
        width: 160,
        render: (_, row) => suggestionCell(row),
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
        render: (_, row) => <StatusPill {...payoutEntryPill(row)} />,
    },
    booksColumn<PartnerPayoutEntry>(books),
    {
        title: 'Actions',
        key: 'actions',
        width: 170,
        neverFold: true,
        render: (_, row) => actions(row),
    },
];

// A debit note is stored with a positive amount; its reversal is the same amount given back,
// so the row shows it as a deduction the way a reversed payout is shown.
export const debitNoteColumns = (
    actions: (row: PartnerDebitNoteEntry) => React.ReactNode,
    books: (row: PartnerDebitNoteEntry) => React.ReactNode = readOnlyBooks
): GenericColumns<PartnerDebitNoteEntry> => [
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
        width: 180,
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
    { title: 'Document', key: 'slip', width: 150, render: (_, row) => <SlipLink slip={row} /> },
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
        render: (_, row) => <StatusPill {...debitNoteEntryPill(row)} />,
    },
    booksColumn<PartnerDebitNoteEntry>(books),
    {
        title: 'Actions',
        key: 'actions',
        width: 170,
        neverFold: true,
        render: (_, row) => actions(row),
    },
];

export const PARTNER_TAB_COPY: Record<
    string,
    { title: string; description: (name: string) => string }
> = {
    [LEDGER_TABS.transactions]: {
        title: 'Transactions',
        description: name =>
            `Orders placed through ${name}'s portal, broken into the parts the share is calculated from. On an ordinary order the partner earns a slice of Peko's commission and platform fee, after the gateway's charge on the order comes off when the partner bears it.`,
    },
    [LEDGER_TABS.ownSubscriptions]: {
        title: 'Own Subscriptions',
        description: name =>
            `Peko subscriptions taken through ${name}'s portal. The share is taken on the full subscription value, not on a commission: Net Revenue, which is the amount paid before GST plus any discount Peko bore, less the gateway's charge when the partner bears it, with GST added on top of the share.`,
    },
    [LEDGER_TABS.payments]: {
        title: 'Payments',
        description: name =>
            `Payouts made to ${name}, with what the ledger suggested beside what was actually paid.`,
    },
    [LEDGER_TABS.debitNotes]: {
        title: 'Debit Notes',
        description: name =>
            `Debit notes raised against ${name}: share taken back by hand, which reduces what is left to pay the same way a payout does.`,
    },
};

const noActions = () => null;

export type PartnerBooksRenderers = {
    payout?: (row: PartnerPayoutEntry) => React.ReactNode;
    debitNote?: (row: PartnerDebitNoteEntry) => React.ReactNode;
};

export const partnerTabColumns = (
    tab: LedgerTabKey,
    payoutActions: (row: PartnerPayoutEntry) => React.ReactNode,
    debitNoteActions: (row: PartnerDebitNoteEntry) => React.ReactNode = noActions,
    books: PartnerBooksRenderers = {}
) => {
    if (tab === LEDGER_TABS.ownSubscriptions) return subscriptionColumns;
    if (tab === LEDGER_TABS.payments) return payoutColumns(payoutActions, books.payout);
    if (tab === LEDGER_TABS.debitNotes) return debitNoteColumns(debitNoteActions, books.debitNote);
    return transactionColumns;
};
