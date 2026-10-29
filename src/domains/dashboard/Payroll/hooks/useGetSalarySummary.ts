import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getSalarySummary, SalarySummaryData } from '../api/salarySummary';

export const useGetSalarySummary = () => {
    const { corporateId } = useAppSelector(state => state.reducer.auth);
    const [data, setData] = useState<SalarySummaryData | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchSummary = useCallback(async () => {
        setIsLoading(true);
        const res = await getSalarySummary(corporateId);
        if (res) setData(res);
        setIsLoading(false);
    }, [corporateId]);

    useEffect(() => {
        fetchSummary();
    }, [fetchSummary]);

    return { data, isLoading, refetch: fetchSummary };
};
