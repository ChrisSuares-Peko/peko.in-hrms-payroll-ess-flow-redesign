import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';
import { formattedDateOnly } from '@utils/dateFormat';

import { getWalletTopUps, TopUpApiItem } from '../../api/admin/walletApi';
import { formatRupeesDecimal } from '../../utils/helpers';
import { TopUpHistoryItem, TopUpStatus } from '../../utils/types';

const toTopUp = (r: TopUpApiItem): TopUpHistoryItem => ({
    key: String(r.id),
    date: r.date ? formattedDateOnly(new Date(r.date)) : '',
    reference: r.reference || '—',
    source: r.method,
    status: (r.status as TopUpStatus) || 'Completed',
    amount: `+${formatRupeesDecimal(r.amount)}`,
});

export const useWalletTopUpsApi = (page = 1, pageSize = 10) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [topUps, setTopUps] = useState<TopUpHistoryItem[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const fetchTopUps = useCallback(async () => {
        setIsLoading(true);
        const res = await getWalletTopUps(role, id, { page, itemsPerPage: pageSize });
        if (res && res.data?.rows) {
            setTopUps(res.data.rows.map(toTopUp));
            setTotal(res.data.count);
        }
        setIsLoading(false);
    }, [role, id, page, pageSize]);

    useEffect(() => {
        fetchTopUps();
    }, [fetchTopUps]);

    return { topUps, total, isLoading, refetch: fetchTopUps };
};
