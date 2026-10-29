import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import {
    getCorporateCardApplications,
    getCorporateCardApplicationsSummary,
} from '../api/corporateCardApplications';
import {
    ApplicationsListPayload,
    ApplicationsSummary,
    CorporateCardApplicationRow,
} from '../types/corporateCardApplications';

const useCorporateCardApplications = (filters: ApplicationsListPayload) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState(0);
    const [tableData, setTableData] = useState<CorporateCardApplicationRow[]>([]);
    const [summary, setSummary] = useState<ApplicationsSummary | null>(null);

    const getData = useCallback(async () => {
        setIsLoading(true);
        const res = await getCorporateCardApplications({ userId: id, userType: role, ...filters });
        if (res) {
            setTableData(res.data);
            setCount(res.recordsTotal);
        }
        setIsLoading(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, role, filters.page, filters.itemsPerPage, filters.searchText, filters.status]);

    // Global overview counts — refetched independently of the list's filter/page so the strip is stable.
    const getSummary = useCallback(async () => {
        const res = await getCorporateCardApplicationsSummary(role, id);
        if (res) setSummary(res);
    }, [role, id]);

    useEffect(() => {
        getData();
    }, [getData]);

    useEffect(() => {
        getSummary();
    }, [getSummary]);

    // After a mutation, refresh both the list and the overview counts in place.
    const refetch = useCallback(() => {
        getData();
        getSummary();
    }, [getData, getSummary]);

    return { isLoading, tableData, count, summary, refetch };
};

export default useCorporateCardApplications;
