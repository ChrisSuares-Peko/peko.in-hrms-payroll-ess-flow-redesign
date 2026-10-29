import { useState } from 'react';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getGstinLookupApi } from '../api/eInvoice';
import { GstinApiResponse, GstinDetails } from '../types/gstinLookup';
import { mapGstinApiToDetails } from '../utils/gstinLookupMapper';

const useGstinLookup = () => {
    const dispatch = useAppDispatch();
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const [details, setDetails] = useState<GstinDetails | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    const search = async (gstin: string): Promise<GstinApiResponse | null> => {
        setIsSearching(true);
        const { data, message } = await getGstinLookupApi({ userId: id, userType: role, gstin });
        setIsSearching(false);
        if (!data) {
            setDetails(null);
            if (message) {
                dispatch(showToast({ description: message, variant: 'error' }));
            }
            return null;
        }
        setDetails(mapGstinApiToDetails(data));
        return data;
    };

    return { details, isSearching, search };
};

export default useGstinLookup;
