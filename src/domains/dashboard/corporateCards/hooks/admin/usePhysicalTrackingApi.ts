import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getPhysicalTracking, PhysicalTrackingApiRow } from '../../api/admin/physicalTrackingApi';

/** Physical card orders with their courier history, for the admin tracking table. */
export const usePhysicalTrackingApi = (page: number, pageSize: number, status?: string) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [rows, setRows] = useState<PhysicalTrackingApiRow[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const fetchTracking = useCallback(async () => {
        setIsLoading(true);
        const res = await getPhysicalTracking(role, id, page, pageSize, status);
        // A failed call must land on the empty state, never leave the table spinning.
        setRows(res && res.data?.rows ? res.data.rows : []);
        setTotal(res && res.data ? (res.data.count ?? 0) : 0);
        setIsLoading(false);
    }, [role, id, page, pageSize, status]);

    useEffect(() => {
        fetchTracking();
    }, [fetchTracking]);

    return { rows, total, isLoading, refetch: fetchTracking };
};
