import { useCallback, useState } from 'react';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { searchGstin } from '../api/tax';
import { GstinSearchResult } from '../types';

const useGstinSearch = () => {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [result, setResult] = useState<GstinSearchResult | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    const search = useCallback(
        async (gstin: string) => {
            setIsSearching(true);
            setResult(null);
            const resp = await searchGstin({ userId: id, userType: role, gstin });
            if (resp && resp.status) {
                setResult(resp.data);
            } else if (resp && !resp.status) {
                dispatch(
                    showToast({ description: resp.message || 'GSTIN not found', variant: 'error' })
                );
            }
            setIsSearching(false);
        },
        [id, role, dispatch]
    );

    const clear = useCallback(() => setResult(null), []);

    return { result, isSearching, search, clear };
};

export default useGstinSearch;
