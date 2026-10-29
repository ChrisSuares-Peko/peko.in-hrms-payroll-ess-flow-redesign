import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getAuditTrail } from '../api/auditTrail';
import { AuditEntry, AuditTrailFilters } from '../types/auditTrail';

export const useAuditTrail = (filters: AuditTrailFilters) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [entries, setEntries] = useState<AuditEntry[]>([]);
    const [count, setCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const load = useCallback(async () => {
        setIsLoading(true);
        const data = await getAuditTrail({ userId: id, userType: role, ...filters });
        if (data) {
            setEntries(data.entries || []);
            setCount(data.recordsTotal || 0);
        }
        setIsLoading(false);
    }, [id, role, filters]);

    useEffect(() => {
        load();
    }, [load]);

    return { entries, count, isLoading };
};

export default useAuditTrail;
