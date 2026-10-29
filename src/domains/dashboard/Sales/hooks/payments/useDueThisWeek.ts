import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getDueThisWeekApi } from '../../api/payments';
import { DueThisWeekItem } from '../../types/payments';

const PAGE_SIZE = 10;

const useDueThisWeek = (open: boolean) => {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const [items, setItems] = useState<DueThisWeekItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    const fetchPage = useCallback(
        async (p: number) => {
            setIsLoading(true);
            const data = await getDueThisWeekApi({
                userId: id,
                userType: role,
                page: p,
                itemsPerPage: PAGE_SIZE,
            });
            if (data) {
                setItems(data.dueThisWeek);
                setTotalRecords(data.recordsTotal);
            }
            setIsLoading(false);
        },
        [id, role]
    );

    useEffect(() => {
        if (!open) return;
        setPage(1);
        fetchPage(1);
    }, [open, fetchPage]);

    const handlePageChange = useCallback(
        (p: number) => {
            setPage(p);
            fetchPage(p);
        },
        [fetchPage]
    );

    return { items, isLoading, page, totalRecords, pageSize: PAGE_SIZE, handlePageChange };
};

export default useDueThisWeek;
