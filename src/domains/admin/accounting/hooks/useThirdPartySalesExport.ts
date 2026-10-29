import { useCallback } from 'react';

import { useAppSelector } from '@src/hooks/store';

import useFileExport from './useFileExport';
import { ThirdPartySalesExportQuery, downloadThirdPartySales } from '../api/thirdPartySales';
import { ExportFormat } from '../types/export';

export default function useThirdPartySalesExport(
    filters: Omit<ThirdPartySalesExportQuery, 'format'>,
    title: string
) {
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const download = useCallback(
        (format: ExportFormat) =>
            downloadThirdPartySales({ userId: id, userType: role, ...filters, format }),
        [id, role, filters]
    );

    return useFileExport(download, `${title} ${filters.from} to ${filters.to}`);
}
