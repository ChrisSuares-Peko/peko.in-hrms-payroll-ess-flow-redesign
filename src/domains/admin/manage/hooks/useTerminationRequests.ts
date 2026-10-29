import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getTerminationRequests } from '../api/corporateCardTerminations';
import {
    TerminationRequestRow,
    TerminationRequestsListPayload,
} from '../types/corporateCardTerminations';

const useTerminationRequests = (filters: TerminationRequestsListPayload) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState(0);
    const [tableData, setTableData] = useState<TerminationRequestRow[]>([]);

    const getData = useCallback(async () => {
        setIsLoading(true);
        const res = await getTerminationRequests({ userId: id, userType: role, ...filters });
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

export default useTerminationRequests;
