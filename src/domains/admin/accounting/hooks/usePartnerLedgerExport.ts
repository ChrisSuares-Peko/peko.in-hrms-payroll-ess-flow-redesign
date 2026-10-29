import { useCallback } from 'react';

import { useAppSelector } from '@src/hooks/store';

import useFileExport from './useFileExport';
import { downloadPartnerLedgerTab } from '../api/partnerLedger';
import { LEDGER_TAB_LABELS, LedgerTabKey } from '../config/ledgerPaths';
import { ExportFormat } from '../types/export';

export default function usePartnerLedgerExport(
    partnerId: string,
    partnerName: string,
    tab: LedgerTabKey,
    filters: { from: string; to: string; searchText?: string; status?: string; mode?: string }
) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const { from, to, searchText, status, mode } = filters;

    const download = useCallback(
        (format: ExportFormat) =>
            downloadPartnerLedgerTab({
                userId: id,
                userType: role,
                partnerId,
                tab,
                from,
                to,
                searchText: searchText || undefined,
                status: status || undefined,
                mode: mode || undefined,
                format,
            }),
        [id, role, partnerId, tab, from, to, searchText, status, mode]
    );

    return useFileExport(download, `${partnerName} ${LEDGER_TAB_LABELS[tab]} ${from} to ${to}`);
}
