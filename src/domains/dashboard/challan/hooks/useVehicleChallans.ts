import { useCallback, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getVehicleChallans } from '../api/index';
import { Challan } from '../types/index';

// Fetches challans for one vehicle (Bill Payments flow), with mock fallback
// until the Droom BE endpoint is live.
export default function useVehicleChallans() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [challans, setChallans] = useState<Challan[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchForVehicle = useCallback(
        async (vehicleNumber: string) => {
            setIsLoading(true);
            const data = await getVehicleChallans({
                userId: id,
                userType: role,
                vehicleNumber,
            });
            // Always show real data only — array on success, empty on failure/unexpected shape.
            // (No mock fallback: never surface fake, payable challans.)
            const result: Challan[] = Array.isArray(data) ? data : [];
            setChallans(result);
            setIsLoading(false);
            return result;
        },
        [id, role]
    );

    return { challans, isLoading, fetchForVehicle };
}
