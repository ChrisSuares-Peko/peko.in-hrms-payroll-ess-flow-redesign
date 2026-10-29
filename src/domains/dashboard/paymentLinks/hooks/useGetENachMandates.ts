import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getENachMandates } from '../api';
import { ENachMandateListItem } from '../types/paymentLinkTypes';

const PAGE_SIZE = 10;

export default function useGetENachMandates() {
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const [isLoading, setIsLoading] = useState(false);
    const [mandates, setMandates] = useState<ENachMandateListItem[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');

    const fetchMandates = useCallback(async () => {
        setIsLoading(true);
        const data = await getENachMandates({
            userId: id,
            userType: role,
            page,
            limit: PAGE_SIZE,
            search: search || undefined,
        });
        setIsLoading(false);

        if (data) {
            setMandates(data.rows || []);
            setTotal(Number(data.total || 0));
            return;
        }

        setMandates([]);
        setTotal(0);
    }, [id, role, page, search]);

    useEffect(() => {
        fetchMandates();
    }, [fetchMandates]);

    return {
        isLoading,
        mandates,
        total,
        page,
        setPage,
        search,
        setSearch,
        pageSize: PAGE_SIZE,
        fetchMandates,
    };
}
