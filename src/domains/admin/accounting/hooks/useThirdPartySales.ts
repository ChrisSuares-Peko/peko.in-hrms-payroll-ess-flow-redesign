import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getThirdPartySales } from '../api/thirdPartySales';
import {
    PaymentLinkEntry,
    PaymentLinksTotals,
    ThirdPartySalesFilters,
} from '../types/thirdPartySales';

const EMPTY_TOTALS: PaymentLinksTotals = {
    links: 0,
    collected: 0,
    pending: 0,
    failed: 0,
    expired: 0,
};

export const useThirdPartySales = (filters: ThirdPartySalesFilters) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [entries, setEntries] = useState<PaymentLinkEntry[]>([]);
    const [totals, setTotals] = useState<PaymentLinksTotals>(EMPTY_TOTALS);
    const [count, setCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const load = useCallback(async () => {
        setIsLoading(true);
        const data = await getThirdPartySales({ userId: id, userType: role, ...filters });
        if (data) {
            setEntries(data.entries || []);
            setTotals(data.totals || EMPTY_TOTALS);
            setCount(data.recordsTotal || 0);
        }
        setIsLoading(false);
    }, [id, role, filters]);

    useEffect(() => {
        load();
    }, [load]);

    return { entries, totals, count, isLoading, refetch: load };
};

export default useThirdPartySales;
