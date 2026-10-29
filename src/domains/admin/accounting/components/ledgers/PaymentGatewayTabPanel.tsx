import { useEffect, useMemo, useState } from 'react';

import { Button, Flex, Modal, Pagination, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';

import GenericTable from '@components/atomic/GenericTable';
import { withFaqTitles } from '@src/domains/admin/accounting/faq/FaqHint';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { showToast } from '@src/slices/apiSlice';

import BooksMarkCell, { REMOVE_FROM_PORTAL_TEXT } from './BooksMarkCell';
import EntryChangeActions from './EntryChangeActions';
import {
    PAYMENT_GATEWAY_TAB_COPY,
    feeColumns,
    receiptColumns,
    transactionColumns,
} from './paymentGatewayColumns';
import {
    PaymentGatewayFeeDrawer,
    PaymentGatewayFeeFormValues,
    PaymentGatewaySettlementDrawer,
    PaymentGatewaySettlementFormValues,
} from './PaymentGatewayEntryDrawers';
import {
    DEPOSIT_MODE_OPTIONS,
    DeleteEntryModal,
    VendorOpeningBalanceDrawer,
    VendorOpeningBalanceFormValues,
    VoidEntryDrawer,
    VoidFormValues,
} from './VendorEntryDrawers';
import {
    createPaymentGatewayFee,
    createPaymentGatewayOpeningBalance,
    createPaymentGatewaySettlement,
    deletePaymentGatewayFee,
    deletePaymentGatewayOpeningBalance,
    deletePaymentGatewaySettlement,
    markPaymentGatewayFeeBooks,
    markPaymentGatewaySettlementBooks,
    reversePaymentGatewayFee,
    reversePaymentGatewaySettlement,
    updatePaymentGatewayFee,
    updatePaymentGatewayOpeningBalance,
    updatePaymentGatewaySettlement,
} from '../../api/paymentGatewayLedger';
import { LEDGER_LEAF_BY_KIND, LEDGER_TABS, LedgerTabKey } from '../../config/ledgerPaths';
import { usePaymentGatewayLedgerTab } from '../../hooks/usePaymentGatewayLedger';
import usePaymentGatewayLedgerExport from '../../hooks/usePaymentGatewayLedgerExport';
import {
    PaymentGatewaySettlementEntry,
    PaymentGatewayTabFilters,
    PaymentGatewayTransactionEntry,
} from '../../types/paymentGatewayLedger';
import { formatInr } from '../../utils/commission';
import { numbered } from '../../utils/text';
import ExportButtons from '../common/ExportButtons';
import LedgerFilterBar, { FilterChoice } from '../common/LedgerFilterBar';
import TabHeader from '../serviceDetail/TabHeader';

const NO_PERMISSION = 'Sorry, you do not have permission to perform this action';

const PAGE_SIZE = 10;

const SETTLEMENT_PAGE_SIZE = 5;

const TRANSACTIONS_TABLE = { tab: 'transactions', label: 'Transactions' } as const;
const RECEIVED_TABLE = { tab: 'received', label: 'Received' } as const;
const FEES_TABLE = { tab: 'fees', label: 'Fees Charged' } as const;

// Each status is a name the table's Status pill uses, so a filter never promises a pill the
// table lacks. Transactions reads the order's own status; the other two read the entry.
const ORDER_STATUS_CHOICES: FilterChoice[] = [
    { value: 'success', label: 'Success' },
    { value: 'refunded', label: 'Refunded' },
    { value: 'failed', label: 'Failed' },
];

const RECEIVED_STATUS_CHOICES: FilterChoice[] = [
    { value: 'received', label: 'Received' },
    { value: 'opening', label: 'Opening' },
    { value: 'reversal', label: 'Reversal' },
    { value: 'reversed', label: 'Reversed' },
    { value: 'deleted', label: 'Deleted' },
];

const FEE_STATUS_CHOICES: FilterChoice[] = [
    { value: 'charged', label: 'Charged' },
    { value: 'reversal', label: 'Reversal' },
    { value: 'reversed', label: 'Reversed' },
    { value: 'deleted', label: 'Deleted' },
];

const STATUS_FILTER = { key: 'status', label: 'Status', placeholder: 'All statuses' };

// Only what was chosen goes to the server.
const given = (entries: Record<string, string | undefined>) =>
    Object.fromEntries(Object.entries(entries).filter(([, value]) => value));

const DATE_FORMAT = 'YYYY-MM-DD';

const EMPTY_SETTLEMENT = {
    amount: '',
    entryDate: dayjs().format(DATE_FORMAT),
    reference: '',
    mode: 'NEFT',
    note: '',
    slipBase64: '',
    slipName: '',
    slipFormat: '',
};

const EMPTY_FEE = {
    amount: '',
    entryDate: dayjs().format(DATE_FORMAT),
    reference: '',
    mode: 'NEFT',
    note: '',
    slipBase64: '',
    slipName: '',
    slipFormat: '',
};

type EditTargetBase = { id: number; label: string; currentDocument: string | null };

type EditTarget =
    | (EditTargetBase & { kind: 'receipt'; values: PaymentGatewaySettlementFormValues })
    | (EditTargetBase & { kind: 'fee'; values: PaymentGatewayFeeFormValues })
    | (EditTargetBase & { kind: 'opening'; values: VendorOpeningBalanceFormValues });

type DeleteTarget = { kind: 'receipt' | 'fee' | 'opening'; id: number; label: string };

const DELETERS = {
    receipt: deletePaymentGatewaySettlement,
    fee: deletePaymentGatewayFee,
    opening: deletePaymentGatewayOpeningBalance,
};

const ENTRY_UPDATERS = { receipt: updatePaymentGatewaySettlement, fee: updatePaymentGatewayFee };

const NO_SLIP = { slipBase64: '', slipName: '', slipFormat: '' };

const slipPayload = (values: { slipBase64: string; slipName: string; slipFormat: string }) =>
    values.slipBase64
        ? {
              slipBase64: values.slipBase64,
              slipName: values.slipName,
              slipFormat: values.slipFormat,
          }
        : {};

const editDate = (value: string | null | undefined) =>
    dayjs(value || undefined).format(DATE_FORMAT);

const receivedLabel = (row: PaymentGatewaySettlementEntry) =>
    row.entryKind === 'OPENING'
        ? 'Opening balance'
        : `Receipt ${row.entryNumber || row.reference || ''}`.trim();

const feeLabel = (row: PaymentGatewaySettlementEntry) =>
    `Fee ${row.entryNumber || row.reference || ''}`.trim();

type BooksKind = 'received' | 'fee';

const BOOKS_MARKERS = {
    received: markPaymentGatewaySettlementBooks,
    fee: markPaymentGatewayFeeBooks,
};

const withReversal = (row: PaymentGatewaySettlementEntry, label: string) =>
    row.entryType === 'REVERSAL' ? `${label} reversal` : label;

type PaymentGatewayTabPanelProps = {
    gatewayId: string;
    gatewayName: string;
    tab: LedgerTabKey;
    range: { from: string; to: string };
    canUpdate: boolean;
    onChanged: () => void;
};

const PaymentGatewayTabPanel = ({
    gatewayId,
    gatewayName,
    tab,
    range,
    canUpdate,
    onChanged,
}: PaymentGatewayTabPanelProps) => {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [page, setPage] = useState(1);
    const [feePage, setFeePage] = useState(1);
    const [saving, setSaving] = useState(false);
    const [recording, setRecording] = useState(false);
    const [recordingFee, setRecordingFee] = useState(false);
    const [opening, setOpening] = useState(false);
    const [voidTarget, setVoidTarget] = useState<{ id: number; label: string } | null>(null);
    const [feeVoidTarget, setFeeVoidTarget] = useState<{ id: number; label: string } | null>(null);
    const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
    const [marking, setMarking] = useState<string | null>(null);
    const [modal, modalContext] = Modal.useModal();

    const isSettlements = tab === LEDGER_TABS.receivedAndBills;

    // Each table is searched and filtered on its own: Transactions, and the two tables of
    // Received & Bills, which share one call but not one search.
    const [transactionQuery, setTransactionQuery] = useState({ searchText: '' });
    const [receivedQuery, setReceivedQuery] = useState({ searchText: '' });
    const [feeQuery, setFeeQuery] = useState({ searchText: '' });
    const transactionSearch = useDebounceSearch(setTransactionQuery);
    const receivedSearch = useDebounceSearch(setReceivedQuery);
    const feeSearch = useDebounceSearch(setFeeQuery);
    const [transactionStatus, setTransactionStatus] = useState<string | undefined>();
    const [receivedStatus, setReceivedStatus] = useState<string | undefined>();
    const [receivedMode, setReceivedMode] = useState<string | undefined>();
    const [feeStatus, setFeeStatus] = useState<string | undefined>();

    const transactionFiltered = Boolean(transactionQuery.searchText || transactionStatus);
    const receivedFiltered = Boolean(receivedQuery.searchText || receivedStatus || receivedMode);
    const feeFiltered = Boolean(feeQuery.searchText || feeStatus);

    // A search or a filter can shrink a table below the page an admin is on, which would
    // otherwise request a page past the end.
    useEffect(() => {
        setPage(1);
    }, [
        range.from,
        range.to,
        transactionQuery.searchText,
        transactionStatus,
        receivedQuery.searchText,
        receivedStatus,
        receivedMode,
    ]);

    useEffect(() => {
        setFeePage(1);
    }, [range.from, range.to, feeQuery.searchText, feeStatus]);

    const filters = useMemo<PaymentGatewayTabFilters>(
        () => ({
            page,
            itemsPerPage: isSettlements ? SETTLEMENT_PAGE_SIZE : PAGE_SIZE,
            from: range.from,
            to: range.to,
            ...(isSettlements
                ? given({
                      searchText: receivedQuery.searchText,
                      status: receivedStatus,
                      mode: receivedMode,
                      feeSearchText: feeQuery.searchText,
                      feeStatus,
                  })
                : given({ searchText: transactionQuery.searchText, status: transactionStatus })),
        }),
        [
            page,
            isSettlements,
            range.from,
            range.to,
            transactionQuery.searchText,
            transactionStatus,
            receivedQuery.searchText,
            receivedStatus,
            receivedMode,
            feeQuery.searchText,
            feeStatus,
        ]
    );

    const { rows, count, feeRows, feeCount, card, isLoading, refetch } = usePaymentGatewayLedgerTab(
        gatewayId,
        tab,
        filters,
        feePage
    );

    const transactionsExport = usePaymentGatewayLedgerExport(
        gatewayId,
        gatewayName,
        TRANSACTIONS_TABLE,
        { ...range, searchText: transactionQuery.searchText, status: transactionStatus }
    );
    const receivedExport = usePaymentGatewayLedgerExport(gatewayId, gatewayName, RECEIVED_TABLE, {
        ...range,
        searchText: receivedQuery.searchText,
        status: receivedStatus,
        mode: receivedMode,
    });
    const feesExport = usePaymentGatewayLedgerExport(gatewayId, gatewayName, FEES_TABLE, {
        ...range,
        searchText: feeQuery.searchText,
        status: feeStatus,
    });

    const copy = PAYMENT_GATEWAY_TAB_COPY[tab];
    const action = LEDGER_LEAF_BY_KIND.payment_gateways.recordActions?.[tab];
    const auth = { userId: id, userType: role, gatewayId };

    const afterWrite = (message: string) => {
        dispatch(showToast({ description: message, variant: 'success' }));
        setRecording(false);
        setRecordingFee(false);
        setOpening(false);
        setVoidTarget(null);
        setFeeVoidTarget(null);
        setEditTarget(null);
        setDeleteTarget(null);
        refetch();
        onChanged();
    };

    const saveOpeningBalance = async (values: VendorOpeningBalanceFormValues) => {
        setSaving(true);
        const result = await createPaymentGatewayOpeningBalance({
            ...auth,
            amount: Number(values.amount) || 0,
            asOfDate: values.asOfDate,
            note: values.note,
            ...(values.slipBase64
                ? {
                      slipBase64: values.slipBase64,
                      slipName: values.slipName,
                      slipFormat: values.slipFormat,
                  }
                : {}),
        });
        setSaving(false);
        if (result) {
            afterWrite(
                `${numbered('Opening balance', result.entryNumber)} of ${formatInr(Number(values.amount) || 0)} set for ${gatewayName}`
            );
        }
    };

    const saveSettlement = async (values: PaymentGatewaySettlementFormValues) => {
        setSaving(true);
        const result = await createPaymentGatewaySettlement({
            ...auth,
            amount: Number(values.amount) || 0,
            entryDate: values.entryDate,
            reference: values.reference,
            mode: values.mode,
            note: values.note,
            ...(values.slipBase64
                ? {
                      slipBase64: values.slipBase64,
                      slipName: values.slipName,
                      slipFormat: values.slipFormat,
                  }
                : {}),
        });
        setSaving(false);
        if (result) {
            afterWrite(
                `${numbered('Receipt', result.receipt.entryNumber)} of ${formatInr(Number(values.amount) || 0)} recorded for ${gatewayName}`
            );
        }
    };

    const saveFee = async (values: PaymentGatewayFeeFormValues) => {
        setSaving(true);
        const result = await createPaymentGatewayFee({
            ...auth,
            amount: Number(values.amount) || 0,
            entryDate: values.entryDate,
            reference: values.reference,
            mode: values.mode,
            note: values.note,
            ...(values.slipBase64
                ? {
                      slipBase64: values.slipBase64,
                      slipName: values.slipName,
                      slipFormat: values.slipFormat,
                  }
                : {}),
        });
        setSaving(false);
        if (result) {
            afterWrite(
                `${numbered('Fee', result.fee.entryNumber)} of ${formatInr(Number(values.amount) || 0)} recorded for ${gatewayName}`
            );
        }
    };

    const saveVoid = async (values: VoidFormValues) => {
        if (!voidTarget) return;
        setSaving(true);
        const result = await reversePaymentGatewaySettlement({
            ...auth,
            id: voidTarget.id,
            reason: values.reason,
        });
        setSaving(false);
        if (result) afterWrite(`${voidTarget.label} reversed`);
    };

    const saveFeeVoid = async (values: VoidFormValues) => {
        if (!feeVoidTarget) return;
        setSaving(true);
        const result = await reversePaymentGatewayFee({
            ...auth,
            id: feeVoidTarget.id,
            reason: values.reason,
        });
        setSaving(false);
        if (result) afterWrite(`${feeVoidTarget.label} reversed`);
    };

    const changeOf = (values: {
        changeReason?: string;
        slipBase64: string;
        slipName: string;
        slipFormat: string;
    }) => ({ ...auth, changeReason: (values.changeReason || '').trim(), ...slipPayload(values) });

    const saveEntryEdit = async (
        values: PaymentGatewaySettlementFormValues | PaymentGatewayFeeFormValues
    ) => {
        if (!editTarget || editTarget.kind === 'opening') return;
        setSaving(true);
        const result = await ENTRY_UPDATERS[editTarget.kind]({
            ...changeOf(values),
            id: editTarget.id,
            amount: Number(values.amount) || 0,
            entryDate: values.entryDate,
            reference: values.reference,
            mode: values.mode,
            note: values.note,
        });
        setSaving(false);
        if (result) afterWrite(`${editTarget.label} updated for ${gatewayName}`);
    };

    const saveOpeningEdit = async (values: VendorOpeningBalanceFormValues) => {
        if (!editTarget) return;
        setSaving(true);
        const result = await updatePaymentGatewayOpeningBalance({
            ...changeOf(values),
            id: editTarget.id,
            amount: Number(values.amount) || 0,
            asOfDate: values.asOfDate,
            note: values.note,
        });
        setSaving(false);
        if (result) afterWrite(`Opening balance updated for ${gatewayName}`);
    };

    const saveDelete = async (values: VoidFormValues) => {
        if (!deleteTarget) return;
        setSaving(true);
        const result = await DELETERS[deleteTarget.kind]({
            ...auth,
            id: deleteTarget.id,
            reason: values.reason,
        });
        setSaving(false);
        if (result) {
            afterWrite(
                `${deleteTarget.label} deleted. Mark it removed from the books to take it off the portal.`
            );
        }
    };

    const sendBooksMark = async (
        kind: BooksKind,
        entryId: number,
        label: string,
        synced: boolean
    ) => {
        setMarking(`${kind}:${entryId}`);
        const result = await BOOKS_MARKERS[kind]({ ...auth, id: entryId, synced });
        setMarking(null);
        if (!result) return;
        if (result.removed) afterWrite(`${label} removed from the portal`);
        else afterWrite(`${label} marked as ${synced ? 'in' : 'not in'} the books`);
    };

    const markBooks =
        (kind: BooksKind, row: PaymentGatewaySettlementEntry, label: string) =>
        (synced: boolean) => {
            if (row.deleted && synced) {
                modal.confirm({
                    title: `Remove ${label} from the portal?`,
                    content: REMOVE_FROM_PORTAL_TEXT,
                    okText: 'Remove from portal',
                    okButtonProps: { danger: true },
                    cancelText: 'Keep it',
                    onOk: () => sendBooksMark(kind, row.id, label, true),
                });
                return;
            }
            sendBooksMark(kind, row.id, label, synced);
        };

    const booksCell = (kind: BooksKind, row: PaymentGatewaySettlementEntry, label: string) => (
        <BooksMarkCell
            entry={row}
            label={label}
            canUpdate={canUpdate}
            busy={marking === `${kind}:${row.id}`}
            onMark={markBooks(kind, row, label)}
        />
    );

    const entryEditTarget = (
        row: PaymentGatewaySettlementEntry,
        kind: 'receipt' | 'fee',
        label: string
    ): EditTarget => {
        const base = { id: row.id, label, currentDocument: row.slipName };
        if (row.entryKind === 'OPENING') {
            return {
                ...base,
                kind: 'opening',
                values: {
                    amount: String(row.amount),
                    asOfDate: editDate(row.entryDate),
                    note: row.note || '',
                    ...NO_SLIP,
                    changeReason: '',
                },
            };
        }
        return {
            ...base,
            kind,
            values: {
                amount: String(row.amount),
                entryDate: editDate(row.entryDate),
                reference: row.reference || '',
                mode: row.mode || 'NEFT',
                note: row.note || '',
                ...NO_SLIP,
                changeReason: '',
            },
        };
    };

    // A reversal row is itself a record; only a live receipt can be reversed, and doing so
    // takes its fee with it.
    const receiptActions = (row: PaymentGatewaySettlementEntry) =>
        row.deleted || row.status === 'VOIDED' || row.entryType === 'REVERSAL' ? null : (
            <Flex gap={8} wrap="wrap">
                <EntryChangeActions
                    label={receivedLabel(row)}
                    canUpdate={canUpdate}
                    changeable={!row.settlementId}
                    onEdit={() =>
                        setEditTarget(entryEditTarget(row, 'receipt', receivedLabel(row)))
                    }
                    onDelete={() =>
                        setDeleteTarget({
                            kind: row.entryKind === 'OPENING' ? 'opening' : 'receipt',
                            id: row.id,
                            label: receivedLabel(row),
                        })
                    }
                    onReverse={() => setVoidTarget({ id: row.id, label: receivedLabel(row) })}
                />
            </Flex>
        );

    const feeActions = (row: PaymentGatewaySettlementEntry) =>
        row.deleted || row.status === 'VOIDED' || row.entryType === 'REVERSAL' ? null : (
            <Flex gap={8} wrap="wrap">
                <EntryChangeActions
                    label={feeLabel(row)}
                    canUpdate={canUpdate}
                    changeable={!row.settlementId}
                    onEdit={() => setEditTarget(entryEditTarget(row, 'fee', feeLabel(row)))}
                    onDelete={() =>
                        setDeleteTarget({ kind: 'fee', id: row.id, label: feeLabel(row) })
                    }
                    onReverse={() => setFeeVoidTarget({ id: row.id, label: feeLabel(row) })}
                />
            </Flex>
        );

    return (
        <div>
            {modalContext}
            <TabHeader
                title={copy ? copy.title : ''}
                description={copy ? copy.description(gatewayName) : ''}
                action={
                    isSettlements ? (
                        action && (
                            <Flex gap={8} wrap="wrap">
                                {!card.openingBalanceSet && (
                                    <Tooltip title={canUpdate ? '' : NO_PERMISSION}>
                                        <Button
                                            disabled={!canUpdate}
                                            onClick={() => setOpening(true)}
                                        >
                                            Set opening balance
                                        </Button>
                                    </Tooltip>
                                )}
                                <Tooltip title={canUpdate ? '' : NO_PERMISSION}>
                                    <Button
                                        type="primary"
                                        disabled={!canUpdate}
                                        onClick={() => setRecording(true)}
                                    >
                                        {action.label}
                                    </Button>
                                </Tooltip>
                            </Flex>
                        )
                    ) : (
                        <ExportButtons
                            onExport={transactionsExport.exportAs}
                            loadingFormat={transactionsExport.exportingFormat}
                            disabled={isLoading || count === 0}
                        />
                    )
                }
            />

            {isSettlements ? (
                <>
                    <Flex justify="space-between" align="center" className="mb-2">
                        <Typography.Text strong className="text-textHeadings">
                            Received
                        </Typography.Text>
                        <ExportButtons
                            onExport={receivedExport.exportAs}
                            loadingFormat={receivedExport.exportingFormat}
                            disabled={isLoading || count === 0}
                        />
                    </Flex>
                    <LedgerFilterBar
                        selects={[
                            {
                                ...STATUS_FILTER,
                                options: RECEIVED_STATUS_CHOICES,
                                value: receivedStatus,
                                onChange: setReceivedStatus,
                                className: 'w-full sm:w-44',
                            },
                            {
                                key: 'mode',
                                label: 'Mode',
                                placeholder: 'All modes',
                                options: DEPOSIT_MODE_OPTIONS,
                                value: receivedMode,
                                onChange: setReceivedMode,
                                className: 'w-full sm:w-36',
                            },
                        ]}
                        search={{
                            value: receivedSearch.searchText,
                            placeholder: 'Search entry no., reference, note or recorded by',
                            onChange: receivedSearch.updateSearchText,
                        }}
                    />
                    <GenericTable
                        rowKey="id"
                        columns={withFaqTitles(
                            receiptColumns(receiptActions, row =>
                                booksCell('received', row, withReversal(row, receivedLabel(row)))
                            ),
                            'Payment Gateways',
                            'Received'
                        )}
                        dataSource={rows as PaymentGatewaySettlementEntry[]}
                        loading={isLoading}
                        pagination={false}
                        locale={{
                            emptyText: receivedFiltered
                                ? 'No receipts match your search or filter.'
                                : 'Nothing received from this gateway yet.',
                        }}
                        className="rounded-xl border border-solid border-borderCard overflow-hidden"
                    />
                    <Pagination
                        current={page}
                        pageSize={SETTLEMENT_PAGE_SIZE}
                        total={count}
                        onChange={setPage}
                        showSizeChanger={false}
                        hideOnSinglePage
                        className="mt-4 text-end justify-end"
                    />

                    <Flex justify="space-between" align="center" className="mt-6 mb-2">
                        <Typography.Text strong className="text-textHeadings">
                            Bills / Fees Charged
                        </Typography.Text>
                        <Flex gap={8} wrap="wrap">
                            <ExportButtons
                                onExport={feesExport.exportAs}
                                loadingFormat={feesExport.exportingFormat}
                                disabled={isLoading || feeCount === 0}
                            />
                            {action && (
                                <Tooltip title={canUpdate ? '' : NO_PERMISSION}>
                                    <Button
                                        type="primary"
                                        disabled={!canUpdate}
                                        onClick={() => setRecordingFee(true)}
                                    >
                                        Record fee
                                    </Button>
                                </Tooltip>
                            )}
                        </Flex>
                    </Flex>
                    <LedgerFilterBar
                        selects={[
                            {
                                ...STATUS_FILTER,
                                options: FEE_STATUS_CHOICES,
                                value: feeStatus,
                                onChange: setFeeStatus,
                                className: 'w-full sm:w-44',
                            },
                        ]}
                        search={{
                            value: feeSearch.searchText,
                            placeholder: 'Search entry no., reference, note or recorded by',
                            onChange: feeSearch.updateSearchText,
                        }}
                    />
                    <GenericTable
                        rowKey="id"
                        columns={withFaqTitles(
                            feeColumns(feeActions, row =>
                                booksCell('fee', row, withReversal(row, feeLabel(row)))
                            ),
                            'Payment Gateways',
                            'Bills'
                        )}
                        dataSource={feeRows}
                        loading={isLoading}
                        pagination={false}
                        locale={{
                            emptyText: feeFiltered
                                ? 'No charges match your search or filter.'
                                : 'No charges recorded for this gateway yet.',
                        }}
                        className="rounded-xl border border-solid border-borderCard overflow-hidden"
                    />
                    <Pagination
                        current={feePage}
                        pageSize={SETTLEMENT_PAGE_SIZE}
                        total={feeCount}
                        onChange={setFeePage}
                        showSizeChanger={false}
                        hideOnSinglePage
                        className="mt-4 text-end justify-end"
                    />
                </>
            ) : (
                <>
                    <LedgerFilterBar
                        selects={[
                            {
                                ...STATUS_FILTER,
                                options: ORDER_STATUS_CHOICES,
                                value: transactionStatus,
                                onChange: setTransactionStatus,
                                className: 'w-full sm:w-44',
                            },
                        ]}
                        search={{
                            value: transactionSearch.searchText,
                            placeholder: 'Search txn ID, subscriber or service',
                            onChange: transactionSearch.updateSearchText,
                        }}
                    />
                    <GenericTable
                        rowKey="id"
                        columns={withFaqTitles(
                            transactionColumns,
                            'Payment Gateways',
                            'Transactions'
                        )}
                        dataSource={rows as PaymentGatewayTransactionEntry[]}
                        loading={isLoading}
                        pagination={false}
                        locale={{
                            emptyText: transactionFiltered
                                ? 'No payments match your search or filter.'
                                : 'No payments through this gateway in this period.',
                        }}
                        className="rounded-xl border border-solid border-borderCard overflow-hidden"
                    />
                    <Pagination
                        current={page}
                        pageSize={PAGE_SIZE}
                        total={count}
                        onChange={setPage}
                        showSizeChanger={false}
                        hideOnSinglePage
                        className="mt-4 text-end justify-end"
                    />
                </>
            )}

            {recording && (
                <PaymentGatewaySettlementDrawer
                    open
                    title={`Record receipt — ${gatewayName}`}
                    isLoading={saving}
                    initialValues={EMPTY_SETTLEMENT}
                    onCancel={() => setRecording(false)}
                    onSubmit={saveSettlement}
                />
            )}
            {recordingFee && (
                <PaymentGatewayFeeDrawer
                    open
                    title={`Record fee — ${gatewayName}`}
                    isLoading={saving}
                    initialValues={EMPTY_FEE}
                    onCancel={() => setRecordingFee(false)}
                    onSubmit={saveFee}
                />
            )}
            {opening && (
                <VendorOpeningBalanceDrawer
                    open
                    title={`Set opening balance — ${gatewayName}`}
                    isLoading={saving}
                    amountLabel="Still to receive (₹)"
                    initialValues={{
                        amount: '',
                        asOfDate: dayjs().format(DATE_FORMAT),
                        note: '',
                        slipBase64: '',
                        slipName: '',
                        slipFormat: '',
                    }}
                    onCancel={() => setOpening(false)}
                    onSubmit={saveOpeningBalance}
                />
            )}
            {voidTarget && (
                <VoidEntryDrawer
                    open
                    title={`Reverse ${voidTarget.label}`}
                    isLoading={saving}
                    initialValues={{ reason: '' }}
                    onCancel={() => setVoidTarget(null)}
                    onSubmit={saveVoid}
                />
            )}
            {feeVoidTarget && (
                <VoidEntryDrawer
                    open
                    title={`Reverse ${feeVoidTarget.label}`}
                    isLoading={saving}
                    initialValues={{ reason: '' }}
                    onCancel={() => setFeeVoidTarget(null)}
                    onSubmit={saveFeeVoid}
                />
            )}
            {editTarget?.kind === 'receipt' && (
                <PaymentGatewaySettlementDrawer
                    open
                    editing
                    currentDocument={editTarget.currentDocument}
                    title={`Edit ${editTarget.label} — ${gatewayName}`}
                    isLoading={saving}
                    initialValues={editTarget.values}
                    onCancel={() => setEditTarget(null)}
                    onSubmit={saveEntryEdit}
                />
            )}
            {editTarget?.kind === 'fee' && (
                <PaymentGatewayFeeDrawer
                    open
                    editing
                    currentDocument={editTarget.currentDocument}
                    title={`Edit ${editTarget.label} — ${gatewayName}`}
                    isLoading={saving}
                    initialValues={editTarget.values}
                    onCancel={() => setEditTarget(null)}
                    onSubmit={saveEntryEdit}
                />
            )}
            {editTarget?.kind === 'opening' && (
                <VendorOpeningBalanceDrawer
                    open
                    editing
                    currentDocument={editTarget.currentDocument}
                    title={`Edit opening balance — ${gatewayName}`}
                    isLoading={saving}
                    amountLabel="Still to receive (₹)"
                    initialValues={editTarget.values}
                    onCancel={() => setEditTarget(null)}
                    onSubmit={saveOpeningEdit}
                />
            )}
            {deleteTarget && (
                <DeleteEntryModal
                    open
                    title={`Delete ${deleteTarget.label}`}
                    isLoading={saving}
                    initialValues={{ reason: '' }}
                    onCancel={() => setDeleteTarget(null)}
                    onSubmit={saveDelete}
                />
            )}
        </div>
    );
};

export default PaymentGatewayTabPanel;
