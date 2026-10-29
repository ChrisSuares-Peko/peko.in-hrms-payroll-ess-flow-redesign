import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getAllBanners } from '../api/index';
import { AllBannersResponse, Banner } from '../types/index';

export default function useBannersApi(position: string) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [allBanners, setAllBanners] = useState<Banner[]>();
    const [isLoading, setIsLoading] = useState(true);
    const [isUserHavingTopPlan, setIsUserHavingTopPlan] = useState(false);

    const getDashboardCounts = useCallback(async () => {
        const data: AllBannersResponse | false = await getAllBanners({
            userId: id,
            userType: role,
            position,
        });
        if (data) {
            setAllBanners(data.result);
            setIsUserHavingTopPlan(data.isUserHavingTopPlan);
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [id, role, position]);

    useEffect(() => {
        getDashboardCounts();
    }, [getDashboardCounts]);

    return { data: allBanners, isLoading, isUserHavingTopPlan };
}
