import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getAllLogs } from '../api/index';

export default function useGetAllLogsApi({
    searchText,
    category,
    sort,
    page,
    itemsPerPage,
    filter,
    from,
    to,
    sortField,
}: any) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [logs, setLogs] = useState<any>([]);
    const [count, setCount] = useState<number>(1);
    const getLogs = useCallback(async () => {
        setIsLoading(true);
        const data: any | false = await getAllLogs({
            userId: id,
            userType: role,
            from,
            to,
            searchText,

            page,
            itemsPerPage,
        });

        if (data) {
            setLogs(data.data);
            setCount(data.recordsTotal);

            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [id, role, from, to, searchText, page, itemsPerPage]);

    useEffect(() => {
        getLogs();
    }, [getLogs]);

    return { isLoading, logs, count };
}
