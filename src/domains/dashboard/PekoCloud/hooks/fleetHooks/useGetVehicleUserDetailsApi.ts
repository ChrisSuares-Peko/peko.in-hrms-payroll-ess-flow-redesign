import { useCallback, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getLatestVehicleUsage } from '../../api/fleet';
import { LatestVehicleDetailsResponse } from '../../types/fleetManagement';

export function useVehicleUsageDetails() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [usageData, setUsageData] = useState<LatestVehicleDetailsResponse | null>(null);

    const getUsageData = useCallback(
        async (fleetId: string) => {
            if (fleetId) {
                const data: any | false = await getLatestVehicleUsage({
                    userId: id,
                    userType: role,
                    fleetId,
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
