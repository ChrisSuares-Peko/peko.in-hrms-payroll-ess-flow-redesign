import { useCallback, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getLatestAssetUsage } from '../../api/assets';
import { LatestAssetUsageResponse } from '../../types/assets/index';

export function useAssetUsageDetails() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [usageData, setUsageData] = useState<LatestAssetUsageResponse | null>(null);

    const getUsageData = useCallback(
        async (assetId: string) => {
            if (assetId) {
                const data: any | false = await getLatestAssetUsage({
                    userId: id,
                    userType: role,
                    assetId,
                });

                if (data) {
                    setUsageData(data.data);
                    return data.data; // Return the fetched data
                }
            }
            return null; // Return null if no data
        },
        [id, role]
    );

    return { usageData, getUsageData };
}
