import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getOtherSales } from '../api/otherSales';
import { OtherSaleEntry, OtherSalesFilters, OtherSalesTotals } from '../types/otherSales';

const EMPTY_TOTALS: OtherSalesTotals = {
    totalAmount: 0,
    platformFee: 0,
    markup: 0,
    couponDiscount: 0,
};

export const useOtherSales = (filters: OtherSalesFilters) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [entries, setEntries] = useState<OtherSaleEntry[]>([]);
    const [totals, setTotals] = useState<OtherSalesTotals>(EMPTY_TOTALS);
    const [count, setCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const load = useCallback(async () => {
        setIsLoading(true);
        const data = await getOtherSales({ userId: id, userType: role, ...filters });
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

export default useOtherSales;
