import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getClosureRequests } from '../api/corporateCardClosures';
import { ClosureRequestRow, ClosureRequestsListPayload } from '../types/corporateCardClosures';

const useClosureRequests = (filters: ClosureRequestsListPayload) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState(0);
    const [tableData, setTableData] = useState<ClosureRequestRow[]>([]);

    const getData = useCallback(async () => {
        setIsLoading(true);
        const res = await getClosureRequests({ userId: id, userType: role, ...filters });
        if (res) {
            setTableData(res.data);
            setCount(res.recordsTotal);
        } else {
            setTableData([]);
            setCount(0);
        }
        setIsLoading(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, role, filters.page, filters.itemsPerPage, filters.status]);

    useEffect(() => {
        getData();
    }, [getData]);

    return { isLoading, tableData, count, refetch: getData };
};

export default useClosureRequests;
