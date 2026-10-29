import { useCallback, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { deleteFleet } from '../api';

export default function useDeleteFleet() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
   
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const deleteApi = useCallback(
        async (payloads: any) => {
            try {
                const data: any = await deleteFleet({
                    userId: id,
                    userType: role,
                    id: payloads.id,
                });
                if (data) {
                 
                    return true;
                   
                }
                 setIsLoading(false)
                return false;
                // Returning the data directly from the API call
            } catch (error) {
                console.error('Error in API call:', error);
                return null; // Return null or handle error as needed
            }
        },
        [id, role]
    );

    return { loading: isLoading, deleteApi };
}
