import { useCallback, useState } from 'react';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { searchByPan } from '../api/tax';
import { PanSearchBusiness } from '../types';

const usePanSearch = () => {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [businesses, setBusinesses] = useState<PanSearchBusiness[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const search = useCallback(
        async (pan: string) => {
            setIsSearching(true);
            setBusinesses([]);
            const resp = await searchByPan({ userId: id, userType: role, pan });
            if (resp && resp.status) {
                setBusinesses(resp.data.businesses);
            } else if (resp && !resp.status) {
                dispatch(
                    showToast({
                        description: resp.message || 'No GST registrations found for this PAN',
                        variant: 'error',
                    })
                );
            }
            setIsSearching(false);
        },
        [id, role, dispatch]
    );

    const clear = useCallback(() => setBusinesses([]), []);

    return { businesses, isSearching, search, clear };
};

export default usePanSearch;
