import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getPlans, getPlansByRegion } from '../api/index';
import { DataOptions } from '../types/eSIM';

export default function useGetOrderDetails(country: string, regionCode?: string) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isPlanLoading, setIsLoading] = useState(true);
    const [plans, setPlans] = useState<DataOptions>();

    const getPlansApi = useCallback(async () => {
        if (!country && !regionCode) return;
        setIsLoading(true);
        const data = regionCode
            ? await getPlansByRegion({
                  userId: id,
                  userType: role,
                  regionCode,
              })
            : await getPlans({
                  userId: id,
                  userType: role,
                  country,
              });
        if (data) {
            setPlans(data);
            setIsLoading(false);
        }
        setIsLoading(false);
    }, [country, regionCode, id, role]);

    useEffect(() => {
        getPlansApi();
    }, [getPlansApi]);

    return { isPlanLoading, plans };
}
