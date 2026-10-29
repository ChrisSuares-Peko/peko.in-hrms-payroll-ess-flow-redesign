import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { fetchStorageData } from '../api/storage';
import { GetStorageDataResponse } from '../types/dash';

export const useStorageDetails = (reload?: boolean) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(true);
    const [storageData, setStorageData] = useState<GetStorageDataResponse>();

    const getStorageUsage = useCallback(async () => {
        setIsLoading(true);
        const data: GetStorageDataResponse | false = await fetchStorageData({
            userId: id,
            userType: role,
        });

        if (data) {
            setStorageData(data);
        }
        setIsLoading(false);
    }, [id, role]);

    useEffect(() => {
        getStorageUsage();
    }, [getStorageUsage, reload]);

    return {
        storageLoading: isLoading,
        storageData,
    };
};
