import { useCallback, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { assign } from '../api';

export default function useAssignDriverApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [refresh, setRefresh] = useState<boolean>(false);

    const assignApi = useCallback(
        async (payload: any) => {
            try {
                const data: any = await assign({
                    userId: id,
                    userType: role,
                    vehicleId: payload.vehicleId,
                    driverId: payload.driverId,
                });
                if (data) {
                    setRefresh(true);
                }
                return data;
                // Returning the data directly from the API call
            } catch (error) {
                console.error('Error in API call:', error);
                return null; // Return null or handle error as needed
            }
        },
        [id, role]
    );

    // Directly return the API function for use externally
    return { assignApi,refresh };
}
