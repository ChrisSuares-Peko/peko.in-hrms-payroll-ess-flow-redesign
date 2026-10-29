import { useCallback } from 'react';

import { useAppSelector } from '@src/hooks/store';

import useFileExport from './useFileExport';
import { FeeDetailsExportQuery, downloadFeeDetails } from '../api/feeDetails';
import { ExportFormat } from '../types/export';

export default function useFeeDetailsExport(
    filters: Omit<FeeDetailsExportQuery, 'format'>,
    fileLabel: string
) {
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const download = useCallback(
        (format: ExportFormat) =>
            downloadFeeDetails({ userId: id, userType: role, ...filters, format }),
        [id, role, filters]
    );

    return useFileExport(download, `${fileLabel} ${filters.from} to ${filters.to}`);
}
