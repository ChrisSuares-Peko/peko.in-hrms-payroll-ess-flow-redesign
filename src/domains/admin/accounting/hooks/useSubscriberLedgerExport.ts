import { useCallback } from 'react';

import { useAppSelector } from '@src/hooks/store';

import useFileExport from './useFileExport';
import { downloadSubscriberLedgerTab } from '../api/subscriberLedger';
import { LEDGER_TAB_LABELS, LedgerTabKey } from '../config/ledgerPaths';
import { ExportFormat } from '../types/export';

export default function useSubscriberLedgerExport(
    credentialId: string,
    subscriberName: string,
    tab: LedgerTabKey,
    filters: {
        from: string;
        to: string;
        searchText?: string;
        status?: string;
        type?: string;
        side?: string;
    }
) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const { from, to, searchText, status, type, side } = filters;

    const download = useCallback(
        (format: ExportFormat) =>
            downloadSubscriberLedgerTab({
                userId: id,
                userType: role,
                credentialId,
                tab,
                from,
                to,
                searchText: searchText || undefined,
                status: status || undefined,
                type: type || undefined,
                side: side || undefined,
                format,
            }),
        [id, role, credentialId, tab, from, to, searchText, status, type, side]
    );

    return useFileExport(download, `${subscriberName} ${LEDGER_TAB_LABELS[tab]} ${from} to ${to}`);
}
