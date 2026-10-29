import { useCallback } from 'react';

import { useAppSelector } from '@src/hooks/store';

import useFileExport from './useFileExport';
import { AuditTrailExportQuery, downloadAuditTrail } from '../api/auditTrail';
import { ExportFormat } from '../types/export';

export default function useAuditTrailExport(filters: Omit<AuditTrailExportQuery, 'format'>) {
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const download = useCallback(
        (format: ExportFormat) =>
            downloadAuditTrail({ userId: id, userType: role, ...filters, format }),
        [id, role, filters]
    );

    const period = filters.from && filters.to ? ` ${filters.from} to ${filters.to}` : '';
    return useFileExport(download, `Audit Trail${period}`);
}
