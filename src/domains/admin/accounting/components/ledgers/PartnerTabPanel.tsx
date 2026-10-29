import { useEffect, useMemo, useState } from 'react';

import { Button, Flex, Modal, Pagination, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';

import GenericTable from '@components/atomic/GenericTable';
import { faqTabOf, withFaqTitles } from '@src/domains/admin/accounting/faq/FaqHint';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { showToast } from '@src/slices/apiSlice';

import BooksMarkCell, { REMOVE_FROM_PORTAL_TEXT } from './BooksMarkCell';
import EntryChangeActions from './EntryChangeActions';
import { PARTNER_TAB_COPY, partnerTabColumns } from './partnerColumns';
import {
    PartnerDebitNoteDrawer,
    PartnerPayoutDrawer,
    PartnerPayoutFormValues,
} from './PartnerEntryDrawers';
import {
    DEPOSIT_MODE_OPTIONS,
    DeleteEntryModal,
    VendorLedgerEntryFormValues,
    VendorOpeningBalanceDrawer,
    VendorOpeningBalanceFormValues,
    VoidEntryDrawer,
    VoidFormValues,
} from './VendorEntryDrawers';
import {
    createPartnerDebitNote,
    createPartnerOpeningBalance,
    createPartnerPayout,
    deletePartnerDebitNote,
    deletePartnerOpeningBalance,
    deletePartnerPayout,
    getPartnerPayoutSuggestion,
    markPartnerDebitNoteBooks,
    markPartnerPayoutBooks,
    reversePartnerDebitNote,
    reversePartnerPayout,
    updatePartnerDebitNote,
    updatePartnerOpeningBalance,
    updatePartnerPayout,
} from '../../api/partnerLedger';
import { LEDGER_LEAF_BY_KIND, LEDGER_TABS, LedgerTabKey } from '../../config/ledgerPaths';
import { usePartnerLedgerTab } from '../../hooks/usePartnerLedger';
import usePartnerLedgerExport from '../../hooks/usePartnerLedgerExport';
import {
    PartnerDebitNoteEntry,
    PartnerLedgerTabFilters,
    PartnerPayoutEntry,
} from '../../types/partnerLedger';
import { formatInr } from '../../utils/commission';
import { numbered } from '../../utils/text';
import ExportButtons from '../common/ExportButtons';
import LedgerFilterBar, { FilterChoice, FilterSpec } from '../common/LedgerFilterBar';
import SummaryStrip from '../serviceDetail/SummaryStrip';
import TabHeader from '../serviceDetail/TabHeader';

const NO_PERMISSION = 'Sorry, you do not have permission to perform this action';

const PAGE_SIZE = 10;

type FilterKey = 'status' | 'mode';

type PartnerFilter = FilterSpec & { key: FilterKey };

type FilterControls = {
    searchPlaceholder: string;
    selects: PartnerFilter[];
    emptyText: string;
};

// Each status is a name the table's Status pill uses, so a filter never promises a pill the
// table lacks. Both order tables read the order's own status.
const ORDER_STATUS_CHOICES: FilterChoice[] = [
    { value: 'success', label: 'Success' },
    { value: 'refunded', label: 'Refunded' },
    { value: 'failed', label: 'Failed' },
];

const statusFilter = (options: FilterChoice[]): PartnerFilter => ({
    key: 'status',
    label: 'Status',
    placeholder: 'All statuses',
    options,
    className: 'w-full sm:w-44',
});

const FILTER_CONTROLS: Partial<Record<LedgerTabKey, FilterControls>> = {
    [LEDGER_TABS.transactions]: {
        searchPlaceholder: 'Search txn ID, subscriber or service',
        selects: [statusFilter(ORDER_STATUS_CHOICES)],
        emptyText: 'No transactions match your search or filter.',
    },
    [LEDGER_TABS.ownSubscriptions]: {
        searchPlaceholder: 'Search txn ID, subscriber or plan',
        selects: [statusFilter(ORDER_STATUS_CHOICES)],
        emptyText: 'No subscriptions match your search or filter.',
    },
    [LEDGER_TABS.payments]: {
        searchPlaceholder: 'Search entry no., reference, note or recorded by',
        selects: [
            statusFilter([
                { value: 'paid', label: 'Paid' },
                { value: 'opening', label: 'Opening' },
                { value: 'reversal', label: 'Reversal' },
                { value: 'reversed', label: 'Reversed' },
                { value: 'deleted', label: 'Deleted' },
            ]),
            {
                key: 'mode',
                label: 'Mode',
                placeholder: 'All modes',
                options: DEPOSIT_MODE_OPTIONS,
                className: 'w-full sm:w-36',
            },
        ],
        emptyText: 'No payments match your search or filter.',
    },
    [LEDGER_TABS.debitNotes]: {
        searchPlaceholder: 'Search entry no., debit note, order, reason or recorded by',
        selects: [
            statusFilter([
                { value: 'active', label: 'Active' },
                { value: 'reversal', label: 'Reversal' },
                { value: 'reversed', label: 'Reversed' },
                { value: 'deleted', label: 'Deleted' },
            ]),
        ],
        emptyText: 'No debit notes match your search or filter.',
    },
};

export const PAYMENTS_CARD_LABELS = { leftToPay: 'Left to pay', lastPayment: 'Last payment' };

const DATE_FORMAT = 'YYYY-MM-DD';

const EMPTY_PAYOUT = {
    amount: '',
    payoutDate: dayjs().format(DATE_FORMAT),
    reference: '',
    mode: 'NEFT',
    note: '',
    slipBase64: '',
    slipName: '',
    slipFormat: '',
};

const EMPTY_DEBIT_NOTE = {
    amount: '',
    gstTreatment: 'INCLUSIVE' as const,
    issueDate: dayjs().format(DATE_FORMAT),
    reason: '',
    againstCorporateTxnId: '',
    slipBase64: '',
    slipName: '',
    slipFormat: '',
};

type VoidTarget = { kind: 'payout' | 'debitNote'; id: number; label: string };

const REVERSERS = { payout: reversePartnerPayout, debitNote: reversePartnerDebitNote };

type EditTargetBase = { id: number; label: string; currentDocument: string | null };

type EditTarget =
    | (EditTargetBase & { kind: 'payout'; values: PartnerPayoutFormValues })
    | (EditTargetBase & { kind: 'opening'; values: VendorOpeningBalanceFormValues })
    | (EditTargetBase & { kind: 'debitNote'; values: VendorLedgerEntryFormValues });

type DeleteTarget = { kind: 'payout' | 'opening' | 'debitNote'; id: number; label: string };

const DELETERS = {
    payout: deletePartnerPayout,
    opening: deletePartnerOpeningBalance,
    debitNote: deletePartnerDebitNote,
};

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

type BooksKind = 'payout' | 'debitNote';

const BOOKS_MARKERS = { payout: markPartnerPayoutBooks, debitNote: markPartnerDebitNoteBooks };

const withReversal = (row: { entryType?: string | null }, label: string) =>
    row.entryType === 'REVERSAL' ? `${label} reversal` : label;

const payoutLabel = (row: PartnerPayoutEntry) =>
    row.entryKind === 'OPENING'
        ? 'Opening balance'
        : `Payout ${row.entryNumber || row.reference || ''}`.trim();

type PartnerTabPanelProps = {
    partnerId: string;
    partnerName: string;
    gstRate?: number | null;
    tab: LedgerTabKey;
    range: { from: string; to: string };
    canUpdate: boolean;
    onChanged: () => void;
};

const PartnerTabPanel = ({
    partnerId,
    partnerName,
    gstRate,
    tab,
    range,
    canUpdate,
    onChanged,
}: PartnerTabPanelProps) => {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [page, setPage] = useState(1);
    const [saving, setSaving] = useState(false);
    const [recording, setRecording] = useState(false);
    const [opening, setOpening] = useState(false);
    const [suggested, setSuggested] = useState<number | null>(null);
    const [voidTarget, setVoidTarget] = useState<VoidTarget | null>(null);
    const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
    const [marking, setMarking] = useState<string | null>(null);
    const [modal, modalContext] = Modal.useModal();

    const [query, setQuery] = useState({ searchText: '' });
    const [selected, setSelected] = useState<Partial<Record<FilterKey, string>>>({});
    const { searchText, updateSearchText } = useDebounceSearch(setQuery);
    const controls = FILTER_CONTROLS[tab];

    const picked = useMemo(
        () =>
            Object.fromEntries(Object.entries(selected).filter(([, value]) => value)) as Partial<
                Record<FilterKey, string>
            >,
        [selected]
    );
    const isFiltered = Boolean(query.searchText) || Object.keys(picked).length > 0;

    // Changing the date range, the search or a filter can shrink the result set below the page
    // an admin is currently on, which would otherwise request a page past the end.
    useEffect(() => {
        setPage(1);
    }, [range.from, range.to, query.searchText, picked]);

    const filters = useMemo<PartnerLedgerTabFilters>(
        () => ({
            page,
            itemsPerPage: PAGE_SIZE,
            from: range.from,
            to: range.to,
            ...(query.searchText ? { searchText: query.searchText } : {}),
            ...picked,
        }),
        [page, range.from, range.to, query.searchText, picked]
    );
    const { rows, count, owed, lastPayoutDate, openingBalanceSet, isLoading, refetch } =
        usePartnerLedgerTab(partnerId, tab, filters);
    const { exportingFormat, exportAs } = usePartnerLedgerExport(partnerId, partnerName, tab, {
        ...range,
        searchText: query.searchText,
        ...picked,
    });

    const copy = PARTNER_TAB_COPY[tab];
    const action = LEDGER_LEAF_BY_KIND.partners.recordActions?.[tab];
    const auth = { userId: id, userType: role, partnerId };
    const isPayments = tab === LEDGER_TABS.payments;
    const isDebitNotes = tab === LEDGER_TABS.debitNotes;

    const afterWrite = (message: string) => {
        dispatch(showToast({ description: message, variant: 'success' }));
        setRecording(false);
        setOpening(false);
        setVoidTarget(null);
        setEditTarget(null);
        setDeleteTarget(null);
        refetch();
        onChanged();
    };

    const saveOpeningBalance = async (values: VendorOpeningBalanceFormValues) => {
        setSaving(true);
        const result = await createPartnerOpeningBalance({
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
                `${numbered('Opening balance', result.entryNumber)} of ${formatInr(Number(values.amount) || 0)} set for ${partnerName}`
            );
        }
    };

    // The figure is fetched when the drawer opens rather than reused from the table, so the
    // amount offered and the amount the server records are the same number.
    const openPayoutDrawer = async () => {
        setSuggested(null);
        setRecording(true);
        const result = await getPartnerPayoutSuggestion(auth);
        if (result) setSuggested(result.suggestedAmount);
    };

    const savePayout = async (values: PartnerPayoutFormValues) => {
        setSaving(true);
        const result = await createPartnerPayout({
            ...auth,
            amount: Number(values.amount) || 0,
            payoutDate: values.payoutDate,
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
                `${numbered('Payout', result.entryNumber)} of ${formatInr(Number(values.amount) || 0)} recorded for ${partnerName}`
            );
        }
    };

    const saveDebitNote = async (values: VendorLedgerEntryFormValues) => {
        setSaving(true);
        const result = await createPartnerDebitNote({
            ...auth,
            amount: Number(values.amount) || 0,
            gstInclusive: values.gstTreatment !== 'EXCLUSIVE',
            issueDate: values.issueDate,
            reason: values.reason,
            againstCorporateTxnId: values.againstCorporateTxnId,
            ...(values.slipBase64
                ? {
                      slipBase64: values.slipBase64,
                      slipName: values.slipName,
                      slipFormat: values.slipFormat,
                  }
                : {}),
        });
        setSaving(false);
        if (result) afterWrite(`Debit note ${result.entryNumber} recorded for ${partnerName}`);
    };

    const saveVoid = async (values: VoidFormValues) => {
        if (!voidTarget) return;
        setSaving(true);
        const result = await REVERSERS[voidTarget.kind]({
            ...auth,
            id: voidTarget.id,
            reason: values.reason,
        });
        setSaving(false);
        if (result) afterWrite(`${voidTarget.label} reversed`);
    };

    const changeOf = (values: {
        changeReason?: string;
        slipBase64: string;
        slipName: string;
        slipFormat: string;
    }) => ({ ...auth, changeReason: (values.changeReason || '').trim(), ...slipPayload(values) });

    const savePayoutEdit = async (values: PartnerPayoutFormValues) => {
        if (!editTarget) return;
        setSaving(true);
        const result = await updatePartnerPayout({
            ...changeOf(values),
            id: editTarget.id,
            amount: Number(values.amount) || 0,
            payoutDate: values.payoutDate,
            reference: values.reference,
            mode: values.mode,
            note: values.note,
        });
        setSaving(false);
        if (result) afterWrite(`${editTarget.label} updated for ${partnerName}`);
    };

    const saveOpeningEdit = async (values: VendorOpeningBalanceFormValues) => {
        if (!editTarget) return;
        setSaving(true);
        const result = await updatePartnerOpeningBalance({
            ...changeOf(values),
            id: editTarget.id,
            amount: Number(values.amount) || 0,
            asOfDate: values.asOfDate,
            note: values.note,
        });
        setSaving(false);
        if (result) afterWrite(`Opening balance updated for ${partnerName}`);
    };

    const saveDebitNoteEdit = async (values: VendorLedgerEntryFormValues) => {
        if (!editTarget) return;
        setSaving(true);
        const result = await updatePartnerDebitNote({
            ...changeOf(values),
            id: editTarget.id,
            amount: Number(values.amount) || 0,
            gstInclusive: values.gstTreatment !== 'EXCLUSIVE',
            issueDate: values.issueDate,
            reason: values.reason,
            againstCorporateTxnId: values.againstCorporateTxnId,
        });
        setSaving(false);
        if (result) afterWrite(`${editTarget.label} updated for ${partnerName}`);
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
        (kind: BooksKind, row: { id: number; deleted?: boolean }, label: string) =>
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

    const booksCell = (kind: BooksKind, row: { id: number; deleted?: boolean }, label: string) => (
        <BooksMarkCell
            entry={row}
            label={label}
            canUpdate={canUpdate}
            busy={marking === `${kind}:${row.id}`}
            onMark={markBooks(kind, row, label)}
        />
    );

    const payoutEditTarget = (row: PartnerPayoutEntry): EditTarget => {
        const base = { id: row.id, label: payoutLabel(row), currentDocument: row.slipName };
        if (row.entryKind === 'OPENING') {
            return {
                ...base,
                kind: 'opening',
                values: {
                    amount: String(row.amount),
                    asOfDate: editDate(row.payoutDate),
                    note: row.note || '',
                    ...NO_SLIP,
                    changeReason: '',
                },
            };
        }
        return {
            ...base,
            kind: 'payout',
            values: {
                amount: String(row.amount),
                payoutDate: editDate(row.payoutDate),
                reference: row.reference || '',
                mode: row.mode || 'NEFT',
                note: row.note || '',
                ...NO_SLIP,
                changeReason: '',
            },
        };
    };

    // A reversal row is itself a record; only a live payout can be reversed.
    const payoutActions = (row: PartnerPayoutEntry) =>
        row.deleted || row.status === 'VOIDED' || row.entryType === 'REVERSAL' ? null : (
            <Flex gap={8} wrap="wrap">
                <EntryChangeActions
                    label={payoutLabel(row)}
                    canUpdate={canUpdate}
                    onEdit={() => setEditTarget(payoutEditTarget(row))}
                    onDelete={() =>
                        setDeleteTarget({
                            kind: row.entryKind === 'OPENING' ? 'opening' : 'payout',
                            id: row.id,
                            label: payoutLabel(row),
                        })
                    }
                    onReverse={() =>
                        setVoidTarget({ kind: 'payout', id: row.id, label: payoutLabel(row) })
                    }
                />
            </Flex>
        );

    const debitNoteActions = (row: PartnerDebitNoteEntry) =>
        row.deleted || row.status === 'VOIDED' || row.entryType === 'REVERSAL' ? null : (
            <Flex gap={8} wrap="wrap">
                <EntryChangeActions
                    label={`Debit note ${row.entryNumber || row.reference}`}
                    canUpdate={canUpdate}
                    onEdit={() =>
                        setEditTarget({
                            kind: 'debitNote',
                            id: row.id,
                            label: `Debit note ${row.entryNumber || row.reference}`,
                            currentDocument: row.slipName,
                            values: {
                                amount: String(
                                    row.gstInclusive === false && row.taxableAmount != null
                                        ? row.taxableAmount
                                        : row.amount
                                ),
                                gstTreatment:
                                    row.gstInclusive === false
                                        ? ('EXCLUSIVE' as const)
                                        : ('INCLUSIVE' as const),
                                issueDate: editDate(row.issueDate),
                                reason: row.reason || '',
                                againstCorporateTxnId: row.againstCorporateTxnId || '',
                                ...NO_SLIP,
                                changeReason: '',
                            },
                        })
                    }
                    onDelete={() =>
                        setDeleteTarget({
                            kind: 'debitNote',
                            id: row.id,
                            label: `Debit note ${row.entryNumber || row.reference}`,
                        })
                    }
                    onReverse={() =>
                        setVoidTarget({
                            kind: 'debitNote',
                            id: row.id,
                            label: `Debit note ${row.entryNumber || row.reference}`,
                        })
                    }
                />
            </Flex>
        );

    const columns = partnerTabColumns(tab, payoutActions, debitNoteActions, {
        payout: row => booksCell('payout', row, withReversal(row, payoutLabel(row))),
        debitNote: row =>
            booksCell(
                'debitNote',
                row,
                withReversal(row, `Debit note ${row.entryNumber || row.reference}`)
            ),
    });

    // Only a payout starts from a figure the ledger worked out; a debit note is typed in.
    const openRecordDrawer = isDebitNotes ? () => setRecording(true) : openPayoutDrawer;

    return (
        <div>
            {modalContext}
            {isPayments && (
                <div className="mb-4">
                    <SummaryStrip
                        faq={{ screen: 'Partners', tab: 'Payments Cards' }}
                        items={[
                            {
                                label: PAYMENTS_CARD_LABELS.leftToPay,
                                value: formatInr(owed),
                                tone: owed > 0 ? ('warning' as const) : ('default' as const),
                            },
                            {
                                label: PAYMENTS_CARD_LABELS.lastPayment,
                                value: lastPayoutDate
                                    ? dayjs(lastPayoutDate).format('DD MMM YYYY')
                                    : 'None yet',
                            },
                        ]}
                        footnote={
                            <Typography.Text className="text-xs text-textBody">
                                Left to pay is everything {partnerName} has earned to date less
                                everything already paid and every debit note raised, so a payout
                                entered below the suggestion stays owed rather than being written
                                off.
                            </Typography.Text>
                        }
                    />
                </div>
            )}
            <TabHeader
                title={copy ? copy.title : ''}
                description={copy ? copy.description(partnerName) : ''}
                action={
                    <Flex gap={8} wrap="wrap">
                        <ExportButtons
                            onExport={exportAs}
                            loadingFormat={exportingFormat}
                            disabled={isLoading || count === 0}
                        />
                        {action && (
                            <>
                                {isPayments && !openingBalanceSet && (
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
                                        onClick={openRecordDrawer}
                                    >
                                        {action.label}
                                    </Button>
                                </Tooltip>
                            </>
                        )}
                    </Flex>
                }
            />
            {controls && (
                <LedgerFilterBar
                    selects={controls.selects.map(filter => ({
                        ...filter,
                        value: selected[filter.key],
                        onChange: value =>
                            setSelected(current => ({ ...current, [filter.key]: value })),
                    }))}
                    search={{
                        value: searchText,
                        placeholder: controls.searchPlaceholder,
                        onChange: updateSearchText,
                    }}
                />
            )}
            <GenericTable
                rowKey="id"
                columns={withFaqTitles(columns, 'Partners', faqTabOf(tab))}
                dataSource={rows}
                loading={isLoading}
                pagination={false}
                locale={controls && isFiltered ? { emptyText: controls.emptyText } : undefined}
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
            {recording && isDebitNotes && (
                <PartnerDebitNoteDrawer
                    open
                    title={`Record debit note — ${partnerName}`}
                    isLoading={saving}
                    gstRate={gstRate}
                    initialValues={EMPTY_DEBIT_NOTE}
                    onCancel={() => setRecording(false)}
                    onSubmit={saveDebitNote}
                />
            )}
            {recording && isPayments && (
                <PartnerPayoutDrawer
                    open
                    title={`Record payout — ${partnerName}`}
                    isLoading={saving}
                    suggestedAmount={suggested}
                    initialValues={{
                        ...EMPTY_PAYOUT,
                        amount: suggested === null ? '' : String(suggested),
                    }}
                    onCancel={() => setRecording(false)}
                    onSubmit={savePayout}
                />
            )}
            {opening && (
                <VendorOpeningBalanceDrawer
                    open
                    title={`Set opening balance — ${partnerName}`}
                    isLoading={saving}
                    amountLabel="Still to pay (₹)"
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
            {editTarget?.kind === 'payout' && (
                <PartnerPayoutDrawer
                    open
                    editing
                    currentDocument={editTarget.currentDocument}
                    title={`Edit ${editTarget.label} — ${partnerName}`}
                    isLoading={saving}
                    suggestedAmount={null}
                    initialValues={editTarget.values}
                    onCancel={() => setEditTarget(null)}
                    onSubmit={savePayoutEdit}
                />
            )}
            {editTarget?.kind === 'opening' && (
                <VendorOpeningBalanceDrawer
                    open
                    editing
                    currentDocument={editTarget.currentDocument}
                    title={`Edit opening balance — ${partnerName}`}
                    isLoading={saving}
                    amountLabel="Still to pay (₹)"
                    initialValues={editTarget.values}
                    onCancel={() => setEditTarget(null)}
                    onSubmit={saveOpeningEdit}
                />
            )}
            {editTarget?.kind === 'debitNote' && (
                <PartnerDebitNoteDrawer
                    open
                    editing
                    gstRate={gstRate}
                    currentDocument={editTarget.currentDocument}
                    title={`Edit ${editTarget.label} — ${partnerName}`}
                    isLoading={saving}
                    initialValues={editTarget.values}
                    onCancel={() => setEditTarget(null)}
                    onSubmit={saveDebitNoteEdit}
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

export default PartnerTabPanel;
