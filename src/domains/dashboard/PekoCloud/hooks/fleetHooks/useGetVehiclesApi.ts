import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { listVehicle } from '../../api/fleet';
import { FleetListingResponse } from '../../types/fleetManagement';

export function useGetVehicle() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [vehicles, setVehicles] = useState<any[]>([]);
    const allVehicleList = useCallback(async () => {
        const data: FleetListingResponse | false = await listVehicle({
            userId: id,
            userType: role,
        });
        if (data) {
            const arr = data?.result?.map(item => ({
                vehicles: item.vehicleName ?? '',
                vehicleType: item.vehicleType ?? '',
                usedBy: item.cloud_employee?.employeeName ?? '',
                vehicleNo: item?.vehicleNumber ?? '',
                purchasedDate: item.purchasedDate ?? '',
                assetType: item?.assetType ?? '',
                dateOfRenewal: item?.dateOfRenewal ?? '',
                amount: item?.amount ?? '',
                status: item?.status ?? '',
                actions: '',
                id: item?.id ?? '',
            }));

            setVehicles(arr);
        }
    }, [role, id]);

    useEffect(() => {
        allVehicleList();
    }, [allVehicleList]);

    const generateVehicleDropdown = (data: any[]) => {
        const excludedStatuses = ['Inactive', 'Maintenance', 'Retired', 'Unavailable'];

        return data
            .filter(veh => !excludedStatuses.includes(veh.status))
            .map(veh => ({
                value: veh.id,
                label: veh.vehicles,
            }));
    };

    return { vehicles, generateVehicleDropdown };
}
