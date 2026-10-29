import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getVerificationAddOnHistory } from '../api';

export default function useGetVerificationAddOnHistory() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [addOnHistoryData, setAddOnHistoryData] = useState<any>();

    const getAddOnHistory = useCallback(async () => {
        setIsLoading(true);
        const data = await getVerificationAddOnHistory({
            userId: id,
            userType: role,
        });

        if (data) {
            setAddOnHistoryData(data);
        }
        setIsLoading(false);
    }, [id, role]);

    useEffect(() => {
        getAddOnHistory();
    }, [getAddOnHistory]);

    return { addOnHistoryData, loading: isLoading, refresh: getAddOnHistory };
}
