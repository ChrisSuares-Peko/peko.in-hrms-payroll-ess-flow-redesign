import { useCallback } from 'react';

import { useAppSelector } from '@src/hooks/store';

import useFileExport from './useFileExport';
import { OtherSalesExportQuery, downloadOtherSales } from '../api/otherSales';
import { ExportFormat } from '../types/export';

export default function useOtherSalesExport(filters: Omit<OtherSalesExportQuery, 'format'>) {
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const download = useCallback(
        (format: ExportFormat) =>
            downloadOtherSales({ userId: id, userType: role, ...filters, format }),
        [id, role, filters]
    );

    return useFileExport(download, `Other Sales ${filters.from} to ${filters.to}`);
}
