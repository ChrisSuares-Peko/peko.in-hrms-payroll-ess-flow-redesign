import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { progress } from '../api/basicInfo';
import { progressResponse } from '../types/index';

export function useProfileProgressApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const { refresh: addressRefresh } = useAppSelector(state => state.reducer.address);
    const { refresh: bankRefresh } = useAppSelector(state => state.reducer.bank);
    const { refresh: basicInfoRefresh } = useAppSelector(state => state.reducer.basicInfo);
    const { refresh: companyInfoRefresh } = useAppSelector(state => state.reducer.companyInfo);

    const [isLoading, setIsLoading] = useState(false);
    const [details, setDetails] = useState<progressResponse>();
    const getProfileProgress = useCallback(async () => {
        setIsLoading(true);
        const data: progressResponse | false = await progress({
            userId: id,
            userType: role,
        });
        if (data) {
            setDetails(data);
        }
        setIsLoading(false);
    }, [id, role]);

    useEffect(() => {
        getProfileProgress();
    }, [getProfileProgress, addressRefresh, bankRefresh, basicInfoRefresh, companyInfoRefresh]);
    return { progressLoader: isLoading, progressData: details };
}
