import { useCallback, useEffect, useState } from 'react';


import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import { getFleet } from '../api';
import { setverifyResponse } from '../slices/turboSlice';

export default function useGetFleetApi(payload: any) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [refresh, setRefresh] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [details, setDetails] = useState<any>();
    const dispatch = useAppDispatch();
  
    const getFleetApi = useCallback(async () => {
        setIsLoading(true);
        const data: any = await getFleet({
            userId: id,
            userType: role,
            id: payload.id,
        });

        if (data) {
            setDetails(data);
            dispatch(setverifyResponse(data.data));
        }
        setRefresh(false);
        setIsLoading(false);
    }, [dispatch, id, payload.id, role]);

    useEffect(() => {
        getFleetApi();
    }, [getFleetApi, refresh]);

    return { details, loading: isLoading, setRefresh };
}
