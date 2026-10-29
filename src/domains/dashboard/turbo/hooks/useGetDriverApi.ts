import { useCallback, useEffect, useState } from 'react';


import {useAppSelector } from '@src/hooks/store';

import { getDriver } from '../api';

export default function useGetDriverApi(payload: any) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [refresh, setRefresh] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [details, setDetails] = useState<any>();
   

    const getDriverApi = useCallback(async () => {
        setIsLoading(true);
        const data: any = await getDriver({
            userId: id,
            userType: role,
            id: payload.id,
        });

        if (data) {
            setDetails(data);
        }
        setRefresh(false);
        setIsLoading(false);
    }, [id, payload.id, role]);

    useEffect(() => {
        getDriverApi();
    }, [getDriverApi, refresh]);

    return { details, loading: isLoading, setRefresh };
}
