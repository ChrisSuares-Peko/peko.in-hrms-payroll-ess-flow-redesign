import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getVerificationCount } from '../api';

export default function useGetVerificationCount() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [countData, setCountData] = useState<any>();

    const getCount = useCallback(async () => {
        setIsLoading(true);
        const data = await getVerificationCount({
            userId: id,
            userType: role,
        });

        if (data) {
            setCountData(data);
        }
        setIsLoading(false);
    }, [id, role]);

    useEffect(() => {
        getCount();
    }, [getCount]);

    return { countData, loading: isLoading, refresh: getCount };
}
