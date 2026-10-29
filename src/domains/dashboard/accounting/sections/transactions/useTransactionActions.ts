import { useMemo, useRef, useState } from 'react';

import { saveAs } from 'file-saver';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { buildBulkHandlers } from './transactionBulkHandlers';
import { buildRowHandlers } from './transactionRowHandlers';
import { exportSelectedTransactions } from '../../api/transactions';
import { Transaction, TransactionMonthGroup, TransactionTab } from '../../utils/transactionsData';

const FILE_MIME: Record<'xlsx' | 'csv', string> = {
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    csv: 'text/csv',
};

// Decode the exported file buffer into a downloadable Blob. The buffer is normally
// a base64 string, but may arrive with a data-URI prefix, be URL-safe encoded, or
// come through as a serialized Node Buffer ({ data: number[] }).
const bufferToBlob = (buffer: string | { data: number[] }, mime: string) => {
    if (typeof buffer !== 'string') {
        return new Blob([new Uint8Array(buffer.data)], { type: mime });
    }
    const base64 = buffer
        .replace(/^data:[^,]*,/, '')
        .replace(/\s/g, '')
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
};

const GENERIC_ERROR =
    'Something went wrong. If the issue persists, please contact support at reach@peko.one';

interface UseTransactionActionsArgs {
    groups: TransactionMonthGroup[];

    onRefetch: () => void;

    activeTab: TransactionTab['key'];
}

export const useTransactionActions = ({
    groups,
    onRefetch,
    activeTab,
}: UseTransactionActionsArgs) => {
    const dispatch = useAppDispatch();
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const [linkingTxn, setLinkingTxn] = useState<Transaction | null>(null);
    const [exporting, setExporting] = useState(false);

    const busyRef = useRef(false);

    const visibleIds = useMemo(
        () => groups.flatMap(group => group.transactions.map(txn => txn.id)),
        [groups]
    );

    const allSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.has(id));
    const someSelected = visibleIds.some(id => selectedIds.has(id));

    const selectedVisibleIds = useMemo(
        () => visibleIds.filter(id => selectedIds.has(id)),
        [visibleIds, selectedIds]
    );

    const toggleId = (set: Set<string>, id: string) => {
        const next = new Set(set);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
    };

    const handleToggleSelectAll = () =>
        setSelectedIds(prev => {
            if (allSelected) {
                const next = new Set(prev);
                visibleIds.forEach(id => next.delete(id));
                return next;
            }
            return new Set([...prev, ...visibleIds]);
        });

    const runAction = async (action: () => Promise<boolean>, successMsg: string) => {
        if (busyRef.current) return false;
        busyRef.current = true;
        try {
            const ok = await action();
            if (ok) {
                dispatch(showToast({ variant: 'success', description: successMsg }));
                onRefetch();
            } else {
                dispatch(showToast({ variant: 'error', description: GENERIC_ERROR }));
            }
            return ok;
        } finally {
            busyRef.current = false;
        }
    };

    const selectedCount = selectedVisibleIds.length;
    const noun = 'transaction(s)';

    const clearSelection = () => setSelectedIds(new Set());

    const runBulk = async (perId: (id: string) => Promise<unknown>, verb: string) => {
        if (busyRef.current) return;
        const ids = selectedVisibleIds;
        const total = ids.length;
        if (!total) return;
        busyRef.current = true;
        try {
            const results = await Promise.all(
                ids.map(id => Promise.resolve(perId(id)).then(Boolean))
            );
            const ok = results.filter(Boolean).length;
            clearSelection();
            if (ok > 0) onRefetch();
            if (ok === total) {
                dispatch(
                    showToast({
                        variant: 'success',
                        description: `${total} ${noun} ${verb} successfully`,
                    })
                );
            } else if (ok > 0) {
                dispatch(
                    showToast({
                        variant: 'error',
                        description: `Only ${ok} of ${total} ${noun} ${verb}. Please retry the rest.`,
                    })
                );
            } else {
                dispatch(showToast({ variant: 'error', description: GENERIC_ERROR }));
            }
        } finally {
            busyRef.current = false;
        }
    };

    const handleExportSelected = async (format: 'excel' | 'csv' = 'excel') => {
        if (exporting) return;
        const ids = selectedVisibleIds.map(Number).filter(Number.isInteger);
        if (!ids.length) return;
        // Guard against a non-string arg (e.g. a click event) reaching the URL.
        const fmt = format === 'csv' ? 'csv' : 'excel';
        // Derive the extension from the requested format — the response fileType can
        // come back as a full MIME (…spreadsheetml.sheet) which would misname the file.
        const ext = fmt === 'csv' ? 'csv' : 'xlsx';
        setExporting(true);
        try {
            const data = await exportSelectedTransactions({ userId, userType, format: fmt, ids });
            if (data) {
                const blob = bufferToBlob(data.buffer, FILE_MIME[ext]);
                saveAs(blob, `Transactions.${ext}`);
                dispatch(
                    showToast({
                        variant: 'success',
                        description: `${ids.length} ${noun} exported successfully`,
                    })
                );
            } else {
                dispatch(showToast({ variant: 'error', description: GENERIC_ERROR }));
            }
        } finally {
            setExporting(false);
        }
    };

    const rowHandlers = buildRowHandlers({ userId, userType, runAction, setEditingId });
    const bulkHandlers = buildBulkHandlers({ userId, userType, runBulk, activeTab });

    return {
        editingId,
        setEditingId,
        selectedIds,
        setSelectedIds,
        linkingTxn,
        setLinkingTxn,
        allSelected,
        someSelected,
        toggleId,
        handleToggleSelectAll,
        selectedCount,
        clearSelection,
        exporting,
        handleExportSelected,
        ...rowHandlers,
        ...bulkHandlers,
    };
};
