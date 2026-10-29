import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import { ancillariesSearchAPI } from '../api/index';
import { setAncillariesSearch } from '../slices/airlineSlice';
import { AncillarySearch } from '../types/ancilaryType';
import { IAncSearchPostData } from '../types/apiPayloadTypes';

export default function useAncillariesSearch() {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [Loading, setLoading] = useState(false);

    const ancSearch = async (postData: IAncSearchPostData) => {
        const data: AncillarySearch | false = await ancillariesSearchAPI({
            userId: id,
            userType: role,
            postData,
        });
        if (data) {
            dispatch(setAncillariesSearch(data));
            setLoading(false);
            return true;
        }
        setLoading(false);
        return false;
    };

    return { handleAncillariesSearch: ancSearch, Loading };
}
