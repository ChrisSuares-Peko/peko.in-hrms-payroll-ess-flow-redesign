import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getBasicInfo } from '../api/index';
import { BasicInfoResponse } from '../types/index';

export default function useBasicInfoApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [data, setData] = useState<BasicInfoResponse | null>(null);

    const getUserBasicInfo = useCallback(async () => {
        setIsLoading(true);
        const resp: BasicInfoResponse | false = await getBasicInfo({
            userId: id,
            userType: role,
        });
        if (resp) {
            setData(resp);
            setIsLoading(false);
        } else {
            setData(null);
            setIsLoading(false);
        }
    }, [id, role]);

    useEffect(() => {
        getUserBasicInfo();
    }, [getUserBasicInfo]);

    return {
        data,
        isLoading,
    };
}
