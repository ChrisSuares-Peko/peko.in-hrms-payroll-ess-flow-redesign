import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getRecentTransactions } from '../api/dashboard';
import { RecentTransactionItem } from '../types/dashboard';

const PAGE_LIMIT = 10;

const useRecentTransactions = (isOpen: boolean) => {
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const [transactions, setTransactions] = useState<RecentTransactionItem[]>([]);
    const [recordsTotal, setRecordsTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    const fetchPage = useCallback(
        async (targetPage: number) => {
            setIsLoading(true);
            const resp = await getRecentTransactions({
                userId,
                userType,
                page: targetPage,
                itemsPerPage: PAGE_LIMIT,
            });
            if (resp) {
                setTransactions(resp.recentTransactions ?? []);
                setRecordsTotal(resp.recordsTotal ?? 0);
                setPage(targetPage);
            }
            setIsLoading(false);
        },
        [userId, userType]
    );

    useEffect(() => {
        if (isOpen) fetchPage(1);
    }, [isOpen, fetchPage]);

    return { transactions, recordsTotal, page, pageLimit: PAGE_LIMIT, isLoading, fetchPage };
};

export default useRecentTransactions;
