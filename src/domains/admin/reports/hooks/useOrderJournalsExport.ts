import { useCallback } from 'react';

import useFileExport from '@src/domains/admin/accounting/hooks/useFileExport';
import { ExportFormat } from '@src/domains/admin/accounting/types/export';
import { useAppSelector } from '@src/hooks/store';

import { OrderJournalsExportQuery, downloadOrderJournals } from '../api/orderJournal';

export default function useOrderJournalsExport(filters: Omit<OrderJournalsExportQuery, 'format'>) {
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const download = useCallback(
        (format: ExportFormat) =>
            downloadOrderJournals({ userId: id, userType: role, ...filters, format }),
        [id, role, filters]
    );

    return useFileExport(download, `Order Journals ${filters.from} to ${filters.to}`);
}
