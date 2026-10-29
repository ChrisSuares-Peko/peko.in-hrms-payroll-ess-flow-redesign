import { useCallback } from 'react';

import { useAppSelector } from '@src/hooks/store';

import useFileExport from './useFileExport';
import {
    SubscriptionDetailsExportQuery,
    downloadSubscriptionDetails,
} from '../api/subscriptionDetails';
import { ExportFormat } from '../types/export';

export default function useSubscriptionDetailsExport(
    filters: Omit<SubscriptionDetailsExportQuery, 'format'>
) {
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const download = useCallback(
        (format: ExportFormat) =>
            downloadSubscriptionDetails({ userId: id, userType: role, ...filters, format }),
        [id, role, filters]
    );

    return useFileExport(download, `Subscription Details ${filters.from} to ${filters.to}`);
}
