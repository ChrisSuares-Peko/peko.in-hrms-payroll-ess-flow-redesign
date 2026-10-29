import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getCorporateCardLookupList } from '../api';
import { LookupListKind } from '../types';

const PAGE_SIZE = 10;

// One paged table on the lookup page (activity, requests, top-ups, dispatches) for the selected corporate.
const useLookupList = <T>(corporateId: number | undefined, kind: LookupListKind) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [rows, setRows] = useState<T[]>([]);
    const [count, setCount] = useState(0);
    const [page, setPage] = useState(1);

    useEffect(() => {
        setPage(1);
    }, [corporateId]);

    const fetchRows = useCallback(async () => {
        if (!corporateId) {
            setRows([]);
            setCount(0);
            return;
        }
        setIsLoading(true);
        const data = await getCorporateCardLookupList<T>(role, id, corporateId, kind, {
            page,
            itemsPerPage: PAGE_SIZE,
        });
        if (data) {
            setRows(data.rows);
            setCount(data.count);
        } else {
            setRows([]);
            setCount(0);
        }
        setIsLoading(false);
    }, [role, id, corporateId, kind, page]);

    useEffect(() => {
        fetchRows();
    }, [fetchRows]);

    return { isLoading, rows, count, page, pageSize: PAGE_SIZE, setPage };
};

export default useLookupList;
