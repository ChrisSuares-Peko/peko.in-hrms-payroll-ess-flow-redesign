import { ReactNode } from 'react';

import { Flex, Typography } from 'antd';
import dayjs from 'dayjs';

import { GenericColumns } from '@components/atomic/GenericTable';

import {
    ManualJournalEvent,
    ManualJournalHistoryRow,
    ManualJournalOrder,
} from '../../types/manualJournal';
import { PillMeta, formatInr } from '../../utils/commission';
import PostingCell from '../common/PostingCell';
import StatusPill from '../common/StatusPill';
import { formatDate, orderStatusPill } from '../ledgers/vendorColumns';

export const ORDER_SUMMARY_LABELS = {
    transaction: 'Transaction',
    date: 'Date',
    service: 'Service',
    customer: 'Customer',
    partner: 'Partner',
    gateway: 'Gateway',
    amount: 'Amount',
    status: 'Status',
};

const partyValue = (name: string, gstNumber: string | null, state: string | null) => (
    <Flex vertical>
        <span>{name}</span>
        <Typography.Text className="text-xs font-normal text-textBody">
            GST: {gstNumber || '—'} · State: {state || '—'}
        </Typography.Text>
    </Flex>
);

// The set-up step: how the order was sold, stated before any figure is worked out. Every
// label here is a FAQ surface, so keep them in the accounts team's words.
export const SETUP_LABELS = {
    paymentThrough: 'Payment Through',
    gatewayAccount: 'Gateway Account',
    orderAmount: 'Order Amount',
    pgAmount: 'Paid Via Gateway',
    subscription: 'Subscription Payment',
    billingType: 'Billing Cycle',
    vendor: 'Vendor Involved',
    commission: 'Commission Charged',
    commissionType: 'Commission Type',
    commissionMode: 'Commission Mode',
    commissionValue: 'Commission Value',
    commissionFixed: 'Fixed Per Transaction',
    commissionInclGst: 'Commission Quoted Incl. GST',
    principalAmount: 'Sold As Principal',
    marginAmount: 'Sold On Margin',
    platformFeeType: 'Platform Fee Type',
    platformFeeValue: 'Platform Fee Value',
    partner: 'Partner Behind The Order',
    partnerShare: 'Partner Share',
    gatewayCharge: 'Gateway Charge',
    gatewayChargeFixed: 'Gateway Charge Per Transaction',
    coupon: 'Coupon Used',
    couponTotal: 'Coupon Total',
};

export const EDITOR_LABELS = {
    setup: 'Set-up',
    split: 'Split Figures',
    lines: 'Lines',
    account: 'Account',
    debit: 'Debit',
    credit: 'Credit',
    amount: 'Amount',
    description: 'Description',
    journalDate: 'Journal Date',
    reason: 'Reason',
};

export const orderSummaryItems = (order: ManualJournalOrder) => [
    { label: ORDER_SUMMARY_LABELS.transaction, value: order.corporateTxnId },
    { label: ORDER_SUMMARY_LABELS.date, value: formatDate(order.transactionDate) },
    { label: ORDER_SUMMARY_LABELS.service, value: order.service || '—' },
    {
        label: ORDER_SUMMARY_LABELS.customer,
        value: partyValue(
            order.customer ? order.customer.name || order.customer.username || '—' : '—',
            order.customer?.gstNumber || null,
            order.customer?.state || null
        ),
    },
    { label: ORDER_SUMMARY_LABELS.partner, value: order.partnerName || 'Peko (Default)' },
    { label: ORDER_SUMMARY_LABELS.gateway, value: order.paymentGateway || '—' },
    {
        label: ORDER_SUMMARY_LABELS.amount,
        value: order.amountInINR === null ? '—' : formatInr(order.amountInINR),
    },
    {
        label: ORDER_SUMMARY_LABELS.status,
        value: <StatusPill {...orderStatusPill(order.status)} />,
    },
];

const lastChangeOf = (event: ManualJournalEvent) => {
    const stamp = event.journal?.manual;
    if (!stamp) return '—';
    return `Recorded by ${stamp.byName || 'admin'} on ${dayjs(stamp.at).format('DD MMM YYYY')}`;
};

export const resultPill = (result: ManualJournalHistoryRow['result']): PillMeta =>
    result === 'POSTED'
        ? { label: 'Posted', tone: 'success' }
        : { label: 'Refused', tone: 'warning' };

export const eventColumns = (
    renderActions: (event: ManualJournalEvent) => ReactNode
): GenericColumns<ManualJournalEvent> => [
    { title: 'Event', key: 'label', width: 170, render: (_, event) => event.label },
    {
        title: 'Event Date',
        key: 'journalDate',
        width: 140,
        render: (_, event) => formatDate(event.journal?.journalDate || event.defaults.journalDate),
    },
    {
        title: 'Posted',
        key: 'posting',
        width: 200,
        render: (_, event) => <PostingCell posting={event.posting} />,
    },
    {
        title: 'Entry Reference',
        key: 'providerJournalId',
        width: 170,
        render: (_, event) => event.journal?.providerJournalId || '—',
    },
    {
        title: 'Last Change',
        key: 'lastChange',
        width: 260,
        render: (_, event) => lastChangeOf(event),
    },
    {
        title: 'Actions',
        key: 'actions',
        width: 160,
        neverFold: true,
        render: (_, event) => renderActions(event),
    },
];

export const historyColumns: GenericColumns<ManualJournalHistoryRow> = [
    {
        title: 'Date',
        key: 'createdAt',
        width: 170,
        render: (_, row) => dayjs(row.createdAt).format('DD MMM YYYY HH:mm'),
    },
    { title: 'Event', key: 'event', width: 150, render: (_, row) => row.event },
    {
        title: 'By',
        key: 'recordedByName',
        width: 160,
        render: (_, row) => row.recordedByName || '—',
    },
    { title: 'Reason', key: 'reason', width: 260, render: (_, row) => row.reason },
    {
        title: 'Result',
        key: 'result',
        width: 200,
        render: (_, row) => (
            <Flex vertical>
                <StatusPill {...resultPill(row.result)} />
                {row.failureReason && (
                    <Typography.Text className="text-xs text-muted">
                        {row.failureReason}
                    </Typography.Text>
                )}
            </Flex>
        ),
    },
    {
        title: 'Entry Reference',
        key: 'providerJournalId',
        width: 170,
        render: (_, row) => row.providerJournalId || '—',
    },
];
