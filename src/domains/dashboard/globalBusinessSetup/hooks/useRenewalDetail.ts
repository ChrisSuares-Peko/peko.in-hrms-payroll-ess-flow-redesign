import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getRenewalDetail } from '../api/globalBusinessSetup';

const useRenewalDetail = (id: string | undefined) => {
    const { role, id: userId } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<boolean>(false);
    const [refreshTick, setRefreshTick] = useState(0);

    const fetchDetail = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        setError(false);

        const res: any | false = await getRenewalDetail({
            userId,
            userType: role,
            id,
        });

        if (res) {
            setData(res);
        } else {
            setData(null);
            setError(true);
        }

        setIsLoading(false);
    }, [id, userId, role]);

    useEffect(() => {
        fetchDetail();
    }, [fetchDetail, refreshTick]);

    const refresh = () => setRefreshTick(t => t + 1);

    return { isLoading, data, error, refresh };
};

export default useRenewalDetail;
