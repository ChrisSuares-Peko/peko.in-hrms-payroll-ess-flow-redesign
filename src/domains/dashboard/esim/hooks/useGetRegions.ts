import { useEffect, useState } from 'react';

import { DropDown } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import { getRegionsApi } from '../api/index';
import { regionList } from '../types/eSIM';

export default function useGetRegions(enabled: boolean) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isRegionLoading, setIsLoading] = useState(false);
    const [regionData, setRegionData] = useState<DropDown>();
    const [regions, setRegions] = useState<regionList[]>();

    useEffect(() => {
        if (!enabled || regionData) return;

        (async () => {
            setIsLoading(true);
            const data = await getRegionsApi({
                userId: id,
                userType: role,
            });
            if (data) {
                setRegions(data);
                setRegionData(
                    data.map(item => ({
                        value: item.code,
                        label: item.region,
                    }))
                );
            }
            setIsLoading(false);
        })();
    }, [enabled, regionData, id, role]);

    return { isRegionLoading, regionData, regions };
}
