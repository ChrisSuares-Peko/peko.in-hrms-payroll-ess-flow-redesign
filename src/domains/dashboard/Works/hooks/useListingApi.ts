import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { listingApi } from '../api/listingApi';
import { ListingResponse, Works } from '../type/index';

export function useListingApi(page: number, itemsPerPage: number) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [works, setWorks] = useState<Works[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState(0);

    const getWorksList = useCallback(async () => {
        const data: ListingResponse | false = await listingApi({
            userId: id,
            userType: role,
            itemsPerPage,
            page,
        });
        if (data) {
            setWorks(data.data.rows);
            setCount(data.data.count);
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [id, itemsPerPage, page, role]);

    useEffect(() => {
        getWorksList();
    }, [getWorksList]);

    return { data: works, isLoading, count };
}
