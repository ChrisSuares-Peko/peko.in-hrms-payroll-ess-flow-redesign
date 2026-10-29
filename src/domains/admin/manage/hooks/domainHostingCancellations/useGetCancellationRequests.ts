import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getCancellationRequests } from '../../api/domainHostingCancellations';
import { DomainHostingCancellation } from '../../types/domainHostingCancellations';

export default function useGetCancellationRequests({
    limit,
    page,
    from,
    to,
    searchText,
    sort,
}: {
    limit: number;
    page: number;
    from: string;
    to: string;
    searchText: string;
    sort: 'ASC' | 'DESC';
}) {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(true);
    const [tableData, setTableData] = useState<DomainHostingCancellation[]>([]);
    const [count, setCount] = useState(0);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        const resp = await getCancellationRequests({
            userType: role,
            userId: id,
            limit,
            page,
            from,
            to,
            searchText,
            sort,
        });
        if (resp && resp.data) {
            setTableData(resp.data);
            setCount(resp.count);
        } else if (resp === false) {
            dispatch(
                showToast({
                    variant: 'error',
                    description: 'Failed to fetch cancellation requests',
                })
            );
        }
        setIsLoading(false);
    }, [role, id, limit, page, from, to, searchText, sort, dispatch]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { isLoading, tableData, count, refetch: fetchData };
}
