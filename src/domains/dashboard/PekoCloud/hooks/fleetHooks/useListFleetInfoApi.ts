import { useState, useCallback, useEffect } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { listVehicleInfo } from '../../api/fleet';
import { FleetInfoResponse } from '../../types/fleetManagement';

export const useGetAllVehicleInfoApi = (reloadTable: boolean) => {
    const initialInfoDetails = {
        totalAssets: 0,
        totalAssigned: 0,
        availableAssets: 0,
        totalUnderMaintenance: 0,
    };
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [infoDetails, setInfoDetails] = useState(initialInfoDetails);
    const [isLoading, setIsLoading] = useState(true);

    const getFleetInfo = useCallback(async () => {
        setIsLoading(true);
        const data: FleetInfoResponse | false = await listVehicleInfo({
            userId: id,
            userType: role,
        });

        if (data) {
            setInfoDetails({
                totalAssets: data.totalFleet,
                totalAssigned: data.totalAssigned,
                totalUnderMaintenance: data.onMaintenance,
                availableAssets: data.totalUnused,
            });
        }
        setIsLoading(false);
    }, [id, role]);

    useEffect(() => {
        getFleetInfo();
    }, [getFleetInfo, reloadTable]);

    return {
        tableLoading: isLoading,
        infoDetails,
    };
};
