import { useCallback, useEffect, useState } from 'react';


import { useAppSelector } from '@src/hooks/store';

import { getUsage } from '../api';

export default function useGetGarageUsageApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [refresh, setRefresh] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [details, setDetails] = useState<any>();
   

    const getUsageApi = useCallback(async () => {
        setIsLoading(true);
        const data: any = await getUsage({
            userId: id,
            userType: role,
        });

        if (data) {
            setDetails(data);
        }
        setRefresh(false);
        setIsLoading(false);
    }, [id, role]);

    useEffect(() => {
        getUsageApi();
    }, [getUsageApi, refresh]);

    return { details, loading: isLoading, setRefresh };
}
