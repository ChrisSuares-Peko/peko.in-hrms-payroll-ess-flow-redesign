import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getTaxOverview } from '../api/tax';
import { TaxOverviewData } from '../types';

const useTaxOverview = () => {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const [data, setData] = useState<TaxOverviewData | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetch = useCallback(async () => {
        setIsLoading(true);
        const resp = await getTaxOverview({ userId: id, userType: role });
        if (resp) setData(resp);
        setIsLoading(false);
    }, [id, role]);

    useEffect(() => {
        fetch();
    }, [fetch]);

    return { data, isLoading, refresh: fetch };
};

export default useTaxOverview;
