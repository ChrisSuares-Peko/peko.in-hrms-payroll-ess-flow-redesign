import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getAllHikes } from '../api/index';

export default function useGetAllHike() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [refresh, setRefresh] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hikeData, setHikeData] = useState<any[]>([]);

    const getHike = useCallback(async () => {
        setIsLoading(true);
        const data: any | false = await getAllHikes({
            userId: id,
            userType: role,
        });

        if (data) {
            setHikeData(data);
        }
        setRefresh(false);
        setIsLoading(false);
    }, [id, role]);

    useEffect(() => {
        getHike();
    }, [getHike, refresh]);

    return { hikeData, loading: isLoading };
}
