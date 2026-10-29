import { useCallback } from 'react';

import { useAppSelector } from '@src/hooks/store';

import useFileExport from './useFileExport';
import { downloadVendorLedgerTab } from '../api/vendorLedger';
import { LEDGER_TAB_LABELS, LedgerTabKey } from '../config/ledgerPaths';
import { ExportFormat } from '../types/export';

export default function useVendorLedgerExport(
    vendorId: string,
    vendorName: string,
    tab: LedgerTabKey,
    filters: { from: string; to: string; searchText?: string; status?: string; mode?: string }
) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const { from, to, searchText, status, mode } = filters;

    const download = useCallback(
        (format: ExportFormat) =>
            downloadVendorLedgerTab({
                userId: id,
                userType: role,
                vendorId,
                tab,
                from,
                to,
                searchText: searchText || undefined,
                status: status || undefined,
                mode: mode || undefined,
                format,
            }),
        [id, role, vendorId, tab, from, to, searchText, status, mode]
    );

    return useFileExport(download, `${vendorName} ${LEDGER_TAB_LABELS[tab]} ${from} to ${to}`);
}
