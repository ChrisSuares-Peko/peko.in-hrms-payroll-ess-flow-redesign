import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getAllFleets } from '../../turbo/api';
import { VehicleData } from '../../turbo/types/index';
import { SelectedVehicle } from '../types/index';

// The user's Turbo fleet, shown on the vehicle-select step. This is the one real
// API call in the vehicle-reports feature — the garage fleets endpoint already
// exists, so there is nothing to mock here.
const useFleetVehicles = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [vehicles, setVehicles] = useState<SelectedVehicle[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchFleet = useCallback(async () => {
        if (!role || !id) return;
        setIsLoading(true);
        // getAllFleets pins itemsPerPage to 10 server-side; the picker shows the
        // first page, which matches the design's short list.
        const res = await getAllFleets({
            userId: id,
            userType: role,
            searchText: '',
            page: 1,
            itemsPerPage: 10,
            from: '',
            to: '',
        });
        if (res) {
            const rows: VehicleData[] = res.data ?? [];
            setVehicles(
                rows.map(row => ({
                    id: row.id,
                    vehicleNumber: row.vehicleNumber,
                    manufacturer: row.manufacturer,
                    model: row.model,
                    bodyType: row.rawData?.body_type,
                }))
            );
        }
        setIsLoading(false);
    }, [role, id]);

    useEffect(() => {
        fetchFleet();
    }, [fetchFleet]);

    return { vehicles, isLoading, refresh: fetchFleet };
};

export default useFleetVehicles;
