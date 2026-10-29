import { useEffect, useMemo, useState } from 'react';

import { FileTextOutlined } from '@ant-design/icons';
import { Button, Flex, Modal, Pagination, Tooltip } from 'antd';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';

import GenericTable from '@components/atomic/GenericTable';
import { faqTabOf, withFaqTitles } from '@src/domains/admin/accounting/faq/FaqHint';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { showToast } from '@src/slices/apiSlice';

import BooksMarkCell, { REMOVE_FROM_PORTAL_TEXT } from './BooksMarkCell';
import EntryChangeActions from './EntryChangeActions';
import { VENDOR_TAB_COPY, taxDocumentLabel, vendorTabColumns } from './vendorColumns';
import {
    DEPOSIT_MODE_OPTIONS,
    DeleteEntryModal,
    VendorCommissionDrawer,
    VendorCostOfSalesDrawer,
    VendorCreditNoteDrawer,
    VendorDebitNoteDrawer,
    VendorDepositDrawer,
    VendorDepositFormValues,
    VendorLedgerEntryFormValues,
    VendorOpeningBalanceDrawer,
    VendorOpeningBalanceFormValues,
    VendorSlipFormValues,
    VoidEntryDrawer,
    VoidFormValues,
} from './VendorEntryDrawers';
import {
    createVendorCommission,
    createVendorCostOfSales,
    createVendorCreditNote,
    createVendorDebitNote,
    createVendorDeposit,
    createVendorOpeningBalance,
    deleteVendorCommission,
    deleteVendorCostOfSales,
    deleteVendorCreditNote,
    deleteVendorDebitNote,
    deleteVendorDeposit,
    deleteVendorOpeningBalance,
    downloadVendorTaxDocument,
    markVendorCommissionBooks,
    markVendorCostOfSalesBooks,
    markVendorCreditNoteBooks,
    markVendorDebitNoteBooks,
    markVendorDepositBooks,
    reverseVendorCommission,
    reverseVendorCostOfSales,
    reverseVendorCreditNote,
    reverseVendorDebitNote,
    reverseVendorDeposit,
    updateVendorCommission,
    updateVendorCostOfSales,
    updateVendorCreditNote,
    updateVendorDebitNote,
    updateVendorDeposit,
    updateVendorOpeningBalance,
} from '../../api/vendorLedger';
import { LEDGER_LEAF_BY_KIND, LEDGER_TABS, LedgerTabKey } from '../../config/ledgerPaths';
import { commissionInvoicePath } from '../../config/manualOperations';
import { useVendorLedgerTab } from '../../hooks/useVendorLedger';
import useVendorLedgerExport from '../../hooks/useVendorLedgerExport';
import {
    VendorCommissionEntry,
    VendorCostOfSalesEntry,
    VendorCreditNoteEntry,
    VendorDebitNoteEntry,
    VendorDepositEntry,
    VendorLedgerTabFilters,
    VendorTaxDocumentSource,
    VendorTaxDocumentTab,
} from '../../types/vendorLedger';
import { formatInr } from '../../utils/commission';
import { numbered } from '../../utils/text';
import ExportButtons from '../common/ExportButtons';
import LedgerFilterBar from '../common/LedgerFilterBar';
import TabHeader from '../serviceDetail/TabHeader';

const NO_PERMISSION = 'Sorry, you do not have permission to perform this action';

const PAGE_SIZE = 10;

type FilterControls = {
    searchPlaceholder: string;
    statusOptions: { value: string; label: string }[];
    modeOptions?: { value: string; label: string }[];
    emptyText: string;
};

// The tabs that can be searched and filtered. Each status is a name the table's Status pill
// uses, so a filter never promises a pill the table lacks.
const FILTER_CONTROLS: Partial<Record<LedgerTabKey, FilterControls>> = {
    [LEDGER_TABS.transactions]: {
        searchPlaceholder: 'Search reference, service or customer',
        statusOptions: [
            { value: 'success', label: 'Success' },
            { value: 'refunded', label: 'Refunded' },
            { value: 'failed', label: 'Failed' },
        ],
        emptyText: 'No transactions match your search or filter.',
    },
    [LEDGER_TABS.commissions]: {
        searchPlaceholder: 'Search entry no., order ref or service',
        statusOptions: [
            { value: 'earned', label: 'Earned' },
            { value: 'refunded', label: 'Refunded' },
            { value: 'active', label: 'Active' },
            { value: 'reversal', label: 'Reversal' },
            { value: 'reversed', label: 'Reversed' },
            { value: 'deleted', label: 'Deleted' },
        ],
        emptyText: 'No commissions match your search or filter.',
    },
    [LEDGER_TABS.costOfSales]: {
        searchPlaceholder: 'Search entry no., reference, order or reason',
        statusOptions: [
            { value: 'active', label: 'Active' },
            { value: 'reversal', label: 'Reversal' },
            { value: 'reversed', label: 'Reversed' },
            { value: 'deleted', label: 'Deleted' },
        ],
        emptyText: 'No cost of sales entries match your search or filter.',
    },
    [LEDGER_TABS.debitNotes]: {
        searchPlaceholder: 'Search entry no., debit note, order or reason',
        statusOptions: [
            { value: 'active', label: 'Active' },
            { value: 'reversal', label: 'Reversal' },
            { value: 'reversed', label: 'Reversed' },
            { value: 'deleted', label: 'Deleted' },
        ],
        emptyText: 'No debit notes match your search or filter.',
    },
    [LEDGER_TABS.deposits]: {
        searchPlaceholder: 'Search entry no., reference, note or recorded by',
        statusOptions: [
            { value: 'active', label: 'Active' },
            { value: 'opening', label: 'Opening' },
            { value: 'reversal', label: 'Reversal' },
            { value: 'reversed', label: 'Reversed' },
            { value: 'deleted', label: 'Deleted' },
        ],
        modeOptions: DEPOSIT_MODE_OPTIONS,
        emptyText: 'No deposits match your search or filter.',
    },
    [LEDGER_TABS.creditNotes]: {
        searchPlaceholder: 'Search entry no., credit note, order or reason',
        statusOptions: [
            { value: 'active', label: 'Active' },
            { value: 'reversal', label: 'Reversal' },
            { value: 'reversed', label: 'Reversed' },
            { value: 'deleted', label: 'Deleted' },
        ],
        emptyText: 'No credit notes match your search or filter.',
    },
};

const EMPTY_SLIP = { slipBase64: '', slipName: '', slipFormat: '' };

const EMPTY_ENTRY = {
    amount: '',
    gstTreatment: 'INCLUSIVE' as const,
    issueDate: dayjs().format('YYYY-MM-DD'),
    reason: '',
    againstCorporateTxnId: '',
};

const slipPayload = (values: VendorSlipFormValues) =>
    values.slipBase64
        ? {
              slipBase64: values.slipBase64,
              slipName: values.slipName,
              slipFormat: values.slipFormat,
          }
        : {};

type VendorTabPanelProps = {
    vendorId: string;
    vendorName: string;
    gstRate?: number | null;
    tab: LedgerTabKey;
    range: { from: string; to: string };
    canUpdate: boolean;
    openingBalanceSet: boolean;
    onChanged: () => void;
};

type VoidTarget = {
    kind: 'deposit' | 'creditNote' | 'commission' | 'costOfSales' | 'debitNote';
    id: number;
    label: string;
};

const REVERSERS = {
    deposit: reverseVendorDeposit,
    creditNote: reverseVendorCreditNote,
    commission: reverseVendorCommission,
    costOfSales: reverseVendorCostOfSales,
    debitNote: reverseVendorDebitNote,
};

type ChangeKind = 'deposit' | 'opening' | 'creditNote' | 'commission' | 'costOfSales' | 'debitNote';

type EditTargetBase = { id: number; label: string; currentDocument: string | null };

type EditTarget =
    | (EditTargetBase & { kind: 'deposit'; values: VendorDepositFormValues })
    | (EditTargetBase & { kind: 'opening'; values: VendorOpeningBalanceFormValues })
    | (EditTargetBase & {
          kind: 'creditNote' | 'commission' | 'costOfSales' | 'debitNote';
          values: VendorLedgerEntryFormValues;
      });

type DeleteTarget = { kind: ChangeKind; id: number; label: string };

const DELETERS = {
    deposit: deleteVendorDeposit,
    opening: deleteVendorOpeningBalance,
    creditNote: deleteVendorCreditNote,
    commission: deleteVendorCommission,
    costOfSales: deleteVendorCostOfSales,
    debitNote: deleteVendorDebitNote,
};

const ENTRY_UPDATERS = {
    creditNote: updateVendorCreditNote,
    commission: updateVendorCommission,
    costOfSales: updateVendorCostOfSales,
    debitNote: updateVendorDebitNote,
};

type EntryEditTarget = Extract<EditTarget, { values: VendorLedgerEntryFormValues }>;

const isEntryEdit = (target: EditTarget): target is EntryEditTarget =>
    target.kind in ENTRY_UPDATERS;

type BooksKind = 'deposit' | 'creditNote' | 'commission' | 'costOfSales' | 'debitNote';

const BOOKS_MARKERS = {
    deposit: markVendorDepositBooks,
    creditNote: markVendorCreditNoteBooks,
    commission: markVendorCommissionBooks,
    costOfSales: markVendorCostOfSalesBooks,
    debitNote: markVendorDebitNoteBooks,
};

const DOCUMENT_BUTTON_TEXT: Record<string, string> = {
    'Commission Invoice': 'Commission Invoice',
    'Tax Invoice': 'Invoice',
};

const withReversal = (row: { entryType?: string | null }, label: string) =>
    row.entryType === 'REVERSAL' ? `${label} reversal` : label;

const editDate = (value: string | null | undefined) =>
    dayjs(value || undefined).format('YYYY-MM-DD');

const editAmount = (value: number | null | undefined) =>
    value === null || value === undefined ? '' : String(value);

const treatmentOf = (row: { gstInclusive?: boolean }) =>
    row.gstInclusive === false ? ('EXCLUSIVE' as const) : ('INCLUSIVE' as const);

const enteredAmount = (
    row: { gstInclusive?: boolean; taxableAmount?: number | null },
    total: number | null | undefined
) => (row.gstInclusive === false && row.taxableAmount != null ? row.taxableAmount : total);

const VendorTabPanel = ({
    vendorId,
    vendorName,
    gstRate,
    tab,
    range,
    canUpdate,
    openingBalanceSet,
    onChanged,
}: VendorTabPanelProps) => {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [page, setPage] = useState(1);
    const [saving, setSaving] = useState(false);
    const [recording, setRecording] = useState(false);
    const [opening, setOpening] = useState(false);
    const [voidTarget, setVoidTarget] = useState<VoidTarget | null>(null);
    const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
    const [marking, setMarking] = useState<string | null>(null);
    const [modal, modalContext] = Modal.useModal();
    const [downloading, setDownloading] = useState<string | null>(null);

    const [query, setQuery] = useState({ searchText: '' });
    const [status, setStatus] = useState<string | undefined>();
    const [mode, setMode] = useState<string | undefined>();
    const { searchText, updateSearchText } = useDebounceSearch(setQuery);
    const controls = FILTER_CONTROLS[tab];

    // Changing the date range, the search or a filter can shrink the result set below the page
    // an admin is currently on, which would otherwise request a page past the end and render
    // an empty table.
    useEffect(() => {
        setPage(1);
    }, [range.from, range.to, query.searchText, status, mode]);

    const filters = useMemo<VendorLedgerTabFilters>(
        () => ({
            page,
            itemsPerPage: PAGE_SIZE,
            from: range.from,
            to: range.to,
            ...(query.searchText ? { searchText: query.searchText } : {}),
            ...(status ? { status } : {}),
            ...(mode ? { mode } : {}),
        }),
        [page, range.from, range.to, query.searchText, status, mode]
    );
    const { rows, count, isLoading, refetch } = useVendorLedgerTab(vendorId, tab, filters);
    const { exportingFormat, exportAs } = useVendorLedgerExport(vendorId, vendorName, tab, {
        ...range,
        searchText: query.searchText,
        status,
        mode,
    });

    const copy = VENDOR_TAB_COPY[tab];
    const action = LEDGER_LEAF_BY_KIND.vendors.recordActions?.[tab];
    const auth = { userId: id, userType: role, vendorId };

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
        const result = await createVendorOpeningBalance({
            ...auth,
            amount: Number(values.amount) || 0,
            asOfDate: values.asOfDate,
            note: values.note,
            ...slipPayload(values),
        });
        setSaving(false);
        if (result) {
            afterWrite(
                `${numbered('Opening balance', result.entryNumber)} of ${formatInr(Number(values.amount) || 0)} set for ${vendorName}`
            );
        }
    };

    const saveDeposit = async (values: VendorDepositFormValues) => {
        setSaving(true);
        const result = await createVendorDeposit({
            ...auth,
            amount: Number(values.amount) || 0,
            depositDate: values.depositDate,
            reference: values.reference,
            mode: values.mode,
            note: values.note,
            ...slipPayload(values),
        });
        setSaving(false);
        if (result) {
            afterWrite(
                `${numbered('Deposit', result.entryNumber)} of ${formatInr(Number(values.amount) || 0)} recorded for ${vendorName}`
            );
        }
    };

    const saveEntry = async (
        values: VendorLedgerEntryFormValues,
        create: typeof createVendorCreditNote,
        noun: string
    ) => {
        setSaving(true);
        const result = await create({
            ...auth,
            amount: Number(values.amount) || 0,
            gstInclusive: values.gstTreatment !== 'EXCLUSIVE',
            issueDate: values.issueDate,
            reason: values.reason,
            againstCorporateTxnId: values.againstCorporateTxnId,
            ...slipPayload(values),
        });
        setSaving(false);
        if (result) afterWrite(`${noun} ${result.entryNumber} recorded for ${vendorName}`);
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

    const changeOf = (values: VendorSlipFormValues) => ({
        ...auth,
        changeReason: (values.changeReason || '').trim(),
        ...slipPayload(values),
    });

    const saveDepositEdit = async (values: VendorDepositFormValues) => {
        if (!editTarget) return;
        setSaving(true);
        const result = await updateVendorDeposit({
            ...changeOf(values),
            id: editTarget.id,
            amount: Number(values.amount) || 0,
            depositDate: values.depositDate,
            reference: values.reference,
            mode: values.mode,
            note: values.note,
        });
        setSaving(false);
        if (result) afterWrite(`${editTarget.label} updated for ${vendorName}`);
    };

    const saveOpeningEdit = async (values: VendorOpeningBalanceFormValues) => {
        if (!editTarget) return;
        setSaving(true);
        const result = await updateVendorOpeningBalance({
            ...changeOf(values),
            id: editTarget.id,
            amount: Number(values.amount) || 0,
            asOfDate: values.asOfDate,
            note: values.note,
        });
        setSaving(false);
        if (result) afterWrite(`Opening balance updated for ${vendorName}`);
    };

    const saveEntryEdit = async (values: VendorLedgerEntryFormValues) => {
        if (!editTarget || !isEntryEdit(editTarget)) return;
        setSaving(true);
        const result = await ENTRY_UPDATERS[editTarget.kind]({
            ...changeOf(values),
            id: editTarget.id,
            amount: Number(values.amount) || 0,
            gstInclusive: values.gstTreatment !== 'EXCLUSIVE',
            issueDate: values.issueDate,
            reason: values.reason,
            againstCorporateTxnId: values.againstCorporateTxnId,
        });
        setSaving(false);
        if (result) afterWrite(`${editTarget.label} updated for ${vendorName}`);
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
        (kind: BooksKind, row: { id: number | null; deleted?: boolean }, label: string) =>
        (synced: boolean) => {
            if (row.id === null) return;
            const rowId = row.id;
            if (row.deleted && synced) {
                modal.confirm({
                    title: `Remove ${label} from the portal?`,
                    content: REMOVE_FROM_PORTAL_TEXT,
                    okText: 'Remove from portal',
                    okButtonProps: { danger: true },
                    cancelText: 'Keep it',
                    onOk: () => sendBooksMark(kind, rowId, label, true),
                });
                return;
            }
            sendBooksMark(kind, rowId, label, synced);
        };

    const booksCell = (
        kind: BooksKind,
        row: { id: number | null; deleted?: boolean },
        label: string
    ) => (
        <BooksMarkCell
            entry={row}
            label={label}
            canUpdate={canUpdate}
            busy={marking === `${kind}:${row.id}`}
            onMark={markBooks(kind, row, label)}
        />
    );

    const downloadTaxDocument = async (
        documentTab: VendorTaxDocumentTab,
        source: VendorTaxDocumentSource,
        documentId: string,
        label: string
    ) => {
        setDownloading(`${source}:${documentId}`);
        const blob = await downloadVendorTaxDocument({
            ...auth,
            tab: documentTab,
            source,
            id: documentId,
        });
        setDownloading(null);

        if (!blob) {
            dispatch(
                showToast({
                    description: `Could not download the ${label.toLowerCase()}`,
                    variant: 'error',
                })
            );
            return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${vendorName} ${label} ${documentId}.pdf`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
    };

    const documentButton = (
        documentTab: VendorTaxDocumentTab,
        source: VendorTaxDocumentSource,
        documentId: string,
        label: string
    ) => (
        <Tooltip title={`Download the ${label.toLowerCase()}`}>
            <Button
                size="small"
                aria-label={label}
                icon={<FileTextOutlined />}
                loading={downloading === `${source}:${documentId}`}
                onClick={() => downloadTaxDocument(documentTab, source, documentId, label)}
            >
                {DOCUMENT_BUTTON_TEXT[label] ?? 'Credit note'}
            </Button>
        </Tooltip>
    );

    const entryLabel = (row: VendorDepositEntry) => {
        if (row.entryType === 'OPENING') return 'Opening balance';
        return `Deposit ${row.entryNumber || row.reference || ''}`.trim();
    };

    const depositEditTarget = (row: VendorDepositEntry): EditTarget => {
        const base = { id: row.id, label: entryLabel(row), currentDocument: row.slipName };
        if (row.entryType === 'OPENING') {
            return {
                ...base,
                kind: 'opening',
                values: {
                    amount: editAmount(row.amount),
                    asOfDate: editDate(row.depositDate),
                    note: row.note || '',
                    ...EMPTY_SLIP,
                    changeReason: '',
                },
            };
        }
        return {
            ...base,
            kind: 'deposit',
            values: {
                amount: editAmount(row.amount),
                depositDate: editDate(row.depositDate),
                reference: row.reference || '',
                mode: row.mode || 'NEFT',
                note: row.note || '',
                ...EMPTY_SLIP,
                changeReason: '',
            },
        };
    };

    // A reversal row is itself a record; only a live original can be reversed.
    const depositActions = (row: VendorDepositEntry) =>
        row.deleted || row.status === 'VOIDED' || row.entryType === 'REVERSAL' ? null : (
            <Flex gap={8} wrap="wrap">
                <EntryChangeActions
                    label={entryLabel(row)}
                    canUpdate={canUpdate}
                    onEdit={() => setEditTarget(depositEditTarget(row))}
                    onDelete={() =>
                        setDeleteTarget({
                            kind: row.entryType === 'OPENING' ? 'opening' : 'deposit',
                            id: row.id,
                            label: entryLabel(row),
                        })
                    }
                    onReverse={() =>
                        setVoidTarget({ kind: 'deposit', id: row.id, label: entryLabel(row) })
                    }
                />
            </Flex>
        );

    // A reversal read off a refund is not a row, so there is nothing to reverse on it.
    const creditNoteActions = (row: VendorCreditNoteEntry) => {
        const manual = row.source === 'MANUAL';
        const source: VendorTaxDocumentSource = manual ? 'manual' : 'auto';
        const documentId = manual ? String(row.id) : String(row.reference || '');
        const reversible =
            manual &&
            row.id !== null &&
            !row.deleted &&
            row.status !== 'VOIDED' &&
            row.entryType !== 'REVERSAL';

        return (
            <Flex gap={8} wrap="wrap">
                {row.hasDocument &&
                    !row.deleted &&
                    documentButton(
                        LEDGER_TABS.creditNotes,
                        source,
                        documentId,
                        taxDocumentLabel(row.source, row.entryType, true)
                    )}
                {reversible && (
                    <EntryChangeActions
                        label={`Credit note ${row.entryNumber || row.reference}`}
                        canUpdate={canUpdate}
                        onEdit={() =>
                            setEditTarget({
                                kind: 'creditNote',
                                id: row.id as number,
                                label: `Credit note ${row.entryNumber || row.reference}`,
                                currentDocument: row.slipName,
                                values: {
                                    amount: editAmount(enteredAmount(row, row.amount)),
                                    gstTreatment: treatmentOf(row),
                                    issueDate: editDate(row.issueDate),
                                    reason: row.reason || '',
                                    againstCorporateTxnId: row.againstCorporateTxnId || '',
                                    ...EMPTY_SLIP,
                                    changeReason: '',
                                },
                            })
                        }
                        onDelete={() =>
                            setDeleteTarget({
                                kind: 'creditNote',
                                id: row.id as number,
                                label: `Credit note ${row.entryNumber || row.reference}`,
                            })
                        }
                        onReverse={() =>
                            setVoidTarget({
                                kind: 'creditNote',
                                id: row.id as number,
                                label: `Credit note ${row.entryNumber || row.reference}`,
                            })
                        }
                    />
                )}
            </Flex>
        );
    };

    const commissionActions = (row: VendorCommissionEntry) => {
        const manual = row.source === 'MANUAL';
        const source: VendorTaxDocumentSource = manual ? 'manual' : 'order';
        const documentId = manual ? String(row.id) : String(row.corporateTxnId || '');
        const reversible =
            manual && !row.deleted && row.status !== 'VOIDED' && row.entryType !== 'REVERSAL';

        return (
            <Flex gap={8} wrap="wrap">
                {row.hasDocument &&
                    !row.deleted &&
                    row.commissionNet !== 0 &&
                    documentButton(
                        LEDGER_TABS.commissions,
                        source,
                        documentId,
                        taxDocumentLabel(row.source, row.entryType, false)
                    )}
                {!row.deleted && (manual || row.hasDocument) && (
                    <Link
                        to={commissionInvoicePath({ vendorId, source, id: documentId })}
                        aria-label={`Edit invoice ${manual ? row.entryNumber : row.corporateTxnId}`}
                    >
                        <Button size="small">Edit invoice</Button>
                    </Link>
                )}
                {reversible && (
                    <EntryChangeActions
                        label={`Commission ${row.entryNumber || row.reference}`}
                        canUpdate={canUpdate}
                        onEdit={() =>
                            setEditTarget({
                                kind: 'commission',
                                id: row.id,
                                label: `Commission ${row.entryNumber || row.reference}`,
                                currentDocument: null,
                                values: {
                                    amount: editAmount(
                                        enteredAmount(row, row.commissionIncludingGST)
                                    ),
                                    gstTreatment: treatmentOf(row),
                                    issueDate: editDate(row.transactionDate),
                                    reason: row.reason || '',
                                    againstCorporateTxnId: row.againstCorporateTxnId || '',
                                    ...EMPTY_SLIP,
                                    changeReason: '',
                                },
                            })
                        }
                        onDelete={() =>
                            setDeleteTarget({
                                kind: 'commission',
                                id: row.id,
                                label: `Commission ${row.entryNumber || row.reference}`,
                            })
                        }
                        onReverse={() =>
                            setVoidTarget({
                                kind: 'commission',
                                id: row.id,
                                label: `Commission ${row.entryNumber || row.reference}`,
                            })
                        }
                    />
                )}
            </Flex>
        );
    };

    const costOfSalesActions = (row: VendorCostOfSalesEntry) => {
        const label = `Cost of sales ${row.entryNumber || row.reference}`;
        const reversible =
            row.id !== null &&
            !row.deleted &&
            row.status !== 'VOIDED' &&
            row.entryType !== 'REVERSAL';
        if (!reversible) return null;

        return (
            <Flex gap={8} wrap="wrap">
                <EntryChangeActions
                    label={label}
                    canUpdate={canUpdate}
                    onEdit={() =>
                        setEditTarget({
                            kind: 'costOfSales',
                            id: row.id as number,
                            label,
                            currentDocument: row.slipName,
                            values: {
                                amount: editAmount(enteredAmount(row, row.amount)),
                                gstTreatment: treatmentOf(row),
                                issueDate: editDate(row.issueDate),
                                reason: row.reason || '',
                                againstCorporateTxnId: row.againstCorporateTxnId || '',
                                ...EMPTY_SLIP,
                                changeReason: '',
                            },
                        })
                    }
                    onDelete={() =>
                        setDeleteTarget({ kind: 'costOfSales', id: row.id as number, label })
                    }
                    onReverse={() =>
                        setVoidTarget({ kind: 'costOfSales', id: row.id as number, label })
                    }
                />
            </Flex>
        );
    };

    const debitNoteActions = (row: VendorDebitNoteEntry) => {
        const label = `Debit note ${row.entryNumber || row.reference}`;
        const reversible =
            row.id !== null &&
            !row.deleted &&
            row.status !== 'VOIDED' &&
            row.entryType !== 'REVERSAL';
        if (!reversible) return null;

        return (
            <Flex gap={8} wrap="wrap">
                <EntryChangeActions
                    label={label}
                    canUpdate={canUpdate}
                    onEdit={() =>
                        setEditTarget({
                            kind: 'debitNote',
                            id: row.id as number,
                            label,
                            currentDocument: row.slipName,
                            values: {
                                amount: editAmount(enteredAmount(row, row.amount)),
                                gstTreatment: treatmentOf(row),
                                issueDate: editDate(row.issueDate),
                                reason: row.reason || '',
                                againstCorporateTxnId: row.againstCorporateTxnId || '',
                                ...EMPTY_SLIP,
                                changeReason: '',
                            },
                        })
                    }
                    onDelete={() =>
                        setDeleteTarget({ kind: 'debitNote', id: row.id as number, label })
                    }
                    onReverse={() =>
                        setVoidTarget({ kind: 'debitNote', id: row.id as number, label })
                    }
                />
            </Flex>
        );
    };

    const columns = vendorTabColumns(
        tab,
        depositActions,
        creditNoteActions,
        commissionActions,
        costOfSalesActions,
        debitNoteActions,
        {
            deposit: row => booksCell('deposit', row, withReversal(row, entryLabel(row))),
            creditNote: row =>
                booksCell(
                    'creditNote',
                    row,
                    withReversal(row, `Credit note ${row.entryNumber || row.reference}`)
                ),
            commission: row =>
                booksCell(
                    'commission',
                    row,
                    withReversal(row, `Commission ${row.entryNumber || row.reference}`)
                ),
            costOfSales: row =>
                booksCell(
                    'costOfSales',
                    row,
                    withReversal(row, `Cost of sales ${row.entryNumber || row.reference}`)
                ),
            debitNote: row =>
                booksCell(
                    'debitNote',
                    row,
                    withReversal(row, `Debit note ${row.entryNumber || row.reference}`)
                ),
        }
    );

    return (
        <div>
            {modalContext}
            <TabHeader
                title={copy ? copy.title : ''}
                description={copy ? copy.description(vendorName) : ''}
                action={
                    <Flex gap={8} wrap="wrap">
                        <ExportButtons
                            onExport={exportAs}
                            loadingFormat={exportingFormat}
                            disabled={isLoading || count === 0}
                        />
                        {action && (
                            <>
                                {tab === LEDGER_TABS.deposits && !openingBalanceSet && (
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
                            </>
                        )}
                    </Flex>
                }
            />
            {controls && (
                <LedgerFilterBar
                    selects={[
                        {
                            key: 'status',
                            label: 'Status',
                            placeholder: 'All statuses',
                            options: controls.statusOptions,
                            value: status,
                            onChange: setStatus,
                            className: 'w-full sm:w-44',
                        },
                        ...(controls.modeOptions
                            ? [
                                  {
                                      key: 'mode',
                                      label: 'Mode',
                                      placeholder: 'All modes',
                                      options: controls.modeOptions,
                                      value: mode,
                                      onChange: setMode,
                                      className: 'w-full sm:w-36',
                                  },
                              ]
                            : []),
                    ]}
                    search={{
                        value: searchText,
                        placeholder: controls.searchPlaceholder,
                        onChange: updateSearchText,
                    }}
                />
            )}
            <GenericTable
                rowKey="id"
                columns={withFaqTitles(columns, 'Vendors', faqTabOf(tab))}
                dataSource={rows}
                loading={isLoading}
                pagination={false}
                locale={
                    controls && (query.searchText || status || mode)
                        ? { emptyText: controls.emptyText }
                        : undefined
                }
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
            {recording && tab === LEDGER_TABS.deposits && (
                <VendorDepositDrawer
                    open
                    title={`Record deposit — ${vendorName}`}
                    isLoading={saving}
                    initialValues={{
                        amount: '',
                        depositDate: dayjs().format('YYYY-MM-DD'),
                        reference: '',
                        mode: 'NEFT',
                        note: '',
                        ...EMPTY_SLIP,
                    }}
                    onCancel={() => setRecording(false)}
                    onSubmit={saveDeposit}
                />
            )}
            {recording && tab === LEDGER_TABS.creditNotes && (
                <VendorCreditNoteDrawer
                    open
                    title={`Record credit note — ${vendorName}`}
                    isLoading={saving}
                    gstRate={gstRate}
                    initialValues={{ ...EMPTY_ENTRY, ...EMPTY_SLIP }}
                    onCancel={() => setRecording(false)}
                    onSubmit={values => saveEntry(values, createVendorCreditNote, 'Credit note')}
                />
            )}
            {recording && tab === LEDGER_TABS.commissions && (
                <VendorCommissionDrawer
                    open
                    title={`Record commission — ${vendorName}`}
                    isLoading={saving}
                    gstRate={gstRate}
                    initialValues={{ ...EMPTY_ENTRY, ...EMPTY_SLIP }}
                    onCancel={() => setRecording(false)}
                    onSubmit={values => saveEntry(values, createVendorCommission, 'Commission')}
                />
            )}
            {recording && tab === LEDGER_TABS.costOfSales && (
                <VendorCostOfSalesDrawer
                    open
                    title={`Record cost of sales — ${vendorName}`}
                    isLoading={saving}
                    gstRate={gstRate}
                    initialValues={{ ...EMPTY_ENTRY, ...EMPTY_SLIP }}
                    onCancel={() => setRecording(false)}
                    onSubmit={values => saveEntry(values, createVendorCostOfSales, 'Cost of sales')}
                />
            )}
            {recording && tab === LEDGER_TABS.debitNotes && (
                <VendorDebitNoteDrawer
                    open
                    title={`Record debit note — ${vendorName}`}
                    isLoading={saving}
                    gstRate={gstRate}
                    initialValues={{ ...EMPTY_ENTRY, ...EMPTY_SLIP }}
                    onCancel={() => setRecording(false)}
                    onSubmit={values => saveEntry(values, createVendorDebitNote, 'Debit note')}
                />
            )}
            {opening && (
                <VendorOpeningBalanceDrawer
                    open
                    title={`Set opening balance — ${vendorName}`}
                    isLoading={saving}
                    initialValues={{
                        amount: '',
                        asOfDate: dayjs().format('YYYY-MM-DD'),
                        note: '',
                        ...EMPTY_SLIP,
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
            {editTarget?.kind === 'deposit' && (
                <VendorDepositDrawer
                    open
                    editing
                    currentDocument={editTarget.currentDocument}
                    title={`Edit ${editTarget.label} — ${vendorName}`}
                    isLoading={saving}
                    initialValues={editTarget.values}
                    onCancel={() => setEditTarget(null)}
                    onSubmit={saveDepositEdit}
                />
            )}
            {editTarget?.kind === 'opening' && (
                <VendorOpeningBalanceDrawer
                    open
                    editing
                    currentDocument={editTarget.currentDocument}
                    title={`Edit opening balance — ${vendorName}`}
                    isLoading={saving}
                    initialValues={editTarget.values}
                    onCancel={() => setEditTarget(null)}
                    onSubmit={saveOpeningEdit}
                />
            )}
            {editTarget?.kind === 'creditNote' && (
                <VendorCreditNoteDrawer
                    open
                    editing
                    gstRate={gstRate}
                    currentDocument={editTarget.currentDocument}
                    title={`Edit ${editTarget.label} — ${vendorName}`}
                    isLoading={saving}
                    initialValues={editTarget.values}
                    onCancel={() => setEditTarget(null)}
                    onSubmit={saveEntryEdit}
                />
            )}
            {editTarget?.kind === 'commission' && (
                <VendorCommissionDrawer
                    open
                    editing
                    gstRate={gstRate}
                    currentDocument={editTarget.currentDocument}
                    title={`Edit ${editTarget.label} — ${vendorName}`}
                    isLoading={saving}
                    initialValues={editTarget.values}
                    onCancel={() => setEditTarget(null)}
                    onSubmit={saveEntryEdit}
                />
            )}
            {editTarget?.kind === 'costOfSales' && (
                <VendorCostOfSalesDrawer
                    open
                    editing
                    gstRate={gstRate}
                    currentDocument={editTarget.currentDocument}
                    title={`Edit ${editTarget.label} — ${vendorName}`}
                    isLoading={saving}
                    initialValues={editTarget.values}
                    onCancel={() => setEditTarget(null)}
                    onSubmit={saveEntryEdit}
                />
            )}
            {editTarget?.kind === 'debitNote' && (
                <VendorDebitNoteDrawer
                    open
                    editing
                    gstRate={gstRate}
                    currentDocument={editTarget.currentDocument}
                    title={`Edit ${editTarget.label} — ${vendorName}`}
                    isLoading={saving}
                    initialValues={editTarget.values}
                    onCancel={() => setEditTarget(null)}
                    onSubmit={saveEntryEdit}
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

export default VendorTabPanel;
