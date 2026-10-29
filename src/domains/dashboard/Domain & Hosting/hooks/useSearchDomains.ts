import { useCallback, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import { searchDomains } from '../api/index';
import { setSearchResults, clearSearchResults } from '../slices/domainHostingSlice';

export default function useSearchDomains() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useAppDispatch();

    const handleSearch = useCallback(
        async (domainName: string) => {
            if (!domainName.trim()) return;
            setIsLoading(true);
            const data = await searchDomains({ domainName, userId: id, userType: role });
            if (data) {
                dispatch(setSearchResults(data));
                // PROTOTYPE-SETUP: MoEngage analytics call removed (SDK stripped).
            }
            setIsLoading(false);
        },
        [dispatch, id, role]
    );

    const handleClear = useCallback(() => {
        dispatch(clearSearchResults());
    }, [dispatch]);

    return { handleSearch, handleClear, isLoading };
}
