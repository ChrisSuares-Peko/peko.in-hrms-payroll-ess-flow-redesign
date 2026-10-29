import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getServiceClassification } from '../../api/serviceClassification';
import {
    ServiceClassificationFilters,
    ServiceClassificationListResponse,
} from '../../types/serviceClassification';

export default function useServiceClassification(filters: ServiceClassificationFilters) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [data, setData] = useState<ServiceClassificationListResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const load = useCallback(async () => {
        setIsLoading(true);
        const result = await getServiceClassification({ userId: id, userType: role, ...filters });
        setData(result || null);
        setIsLoading(false);
    }, [id, role, filters]);

    useEffect(() => {
        load();
    }, [load]);

    return {
        rows: data?.services ?? [],
        count: data?.recordsTotal ?? 0,
        isLoading,
        refetch: load,
    };
}
