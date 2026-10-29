import { useCallback } from 'react';

import { useAppSelector } from '@src/hooks/store';

import useFileExport from './useFileExport';
import { downloadPaymentGatewayLedgerTab } from '../api/paymentGatewayLedger';
import { ExportFormat } from '../types/export';

// The table being exported: the path segment the server knows it by, and what the file is called.
export type PaymentGatewayExportTable = {
    tab: 'transactions' | 'received' | 'fees';
    label: string;
};

export default function usePaymentGatewayLedgerExport(
    gatewayId: string,
    gatewayName: string,
    table: PaymentGatewayExportTable,
    filters: { from: string; to: string; searchText?: string; status?: string; mode?: string }
) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const { from, to, searchText, status, mode } = filters;
    const { tab, label } = table;

    const download = useCallback(
        (format: ExportFormat) =>
            downloadPaymentGatewayLedgerTab({
                userId: id,
                userType: role,
                gatewayId,
                tab,
                from,
                to,
                searchText: searchText || undefined,
                status: status || undefined,
                mode: mode || undefined,
                format,
            }),
        [id, role, gatewayId, tab, from, to, searchText, status, mode]
    );

    return useFileExport(download, `${gatewayName} ${label} ${from} to ${to}`);
}
