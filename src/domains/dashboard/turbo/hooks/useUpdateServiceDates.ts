import { useCallback, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { updateFleetServiceDates } from '../api';

export default function useUpdateServiceDates() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [loading, setLoading] = useState(false);

    const updateServiceDatesApi = useCallback(
        async (payload: { id: number; lastServiceDate: string; nextServiceDue: string }) => {
            setLoading(true);
            try {
                const data: any = await updateFleetServiceDates({
                    userId: id,
                    userType: role,
                    id: payload.id,
                    lastServiceDate: payload.lastServiceDate,
                    nextServiceDue: payload.nextServiceDue,
                });
                return data || false;
            } catch (error) {
                console.error('Error updating service dates:', error);
                return false;
            } finally {
                setLoading(false);
            }
        },
        [id, role]
    );

    return { updateServiceDatesApi, loading };
}
