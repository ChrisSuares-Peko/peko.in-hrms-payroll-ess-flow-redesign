import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getTopUpPackagesList } from '../api/index';
import { TopUpPlanList } from '../types/TopUp';

export default function useGetTopUpPackages(iccid: string) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [packages, setPackages] = useState<any>();
    const [packagesTotal, setPackagesTotal] = useState<number>();
    const [conversionRate, setConversionRate] = useState<number>(1);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const getpackages = useCallback(async () => {
        const data: TopUpPlanList | false = await getTopUpPackagesList({
            userId: id,
            userType: role,
            iccid,
        });

        if (data) {
            setPackages(data.planList);
            setPackagesTotal(data.planList.length);
            setConversionRate(data.usdToINR);
        }
        setIsLoading(false);
    }, [iccid, id, role]);

    useEffect(() => {
        getpackages();
    }, [getpackages]);

    return { data: packages, packagesTotal, conversionRate, isLoading };
}
