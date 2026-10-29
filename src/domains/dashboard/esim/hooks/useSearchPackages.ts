import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getPackagesList } from '../api/index';
import { PackageList, PackageListItem } from '../types/packagesList';

export default function useSearchPackages(countryCode: string, esimType: string) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(true);
    const [packages, setPackages] = useState<PackageListItem[]>();
    const [conversionRate, setConversionRate] = useState<number>(1);

    const getpackages = useCallback(async () => {
        setIsLoading(true);
        const data: PackageList | false = await getPackagesList({
            userId: id,
            userType: role,
            countryCode: esimType !== 'local' ? ' ' : countryCode,
            esimType: esimType === 'regional' ? 'global' : esimType,
        });

        if (data) {
            const filteredPackages = data.packages.filter(v => v.slug !== 'afghanistan');
            setPackages(filteredPackages);
            setConversionRate(data.usdToINR);
        }
        setIsLoading(false);
    }, [countryCode, esimType, id, role]);

    useEffect(() => {
        getpackages();
    }, [getpackages]);

    return { data: packages, getpackages, conversionRate, isLoading };
}
