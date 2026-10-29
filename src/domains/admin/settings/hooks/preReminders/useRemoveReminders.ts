import { useState, useCallback } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { removeReminders } from '../../api/preReminder'; // Adjust the import path as needed

export default function useRemoveReminders() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);

    const deleteReminder = useCallback(
        async ({ day, scheduledTime }: { day: number; scheduledTime: string }) => {
            setIsLoading(true);

            // Pass the entire object to the API
            const success = await removeReminders({
                userId: id,
                userType: role,
                day,
                scheduledTime, // Add scheduledTime to the params
            });

            setIsLoading(false);

            return !!success;
        },
        [id, role]
    );

    return { deleteReminder, isLoading };
}
