import { useCallback, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { AddReminders } from '../../api/preReminder';
import { Data, reminderPyload } from '../../types/preReminders';

export default function useAddReminders() {
    const { role, id } = useAppSelector(state => state.reducer.auth); // Adjust the selector as per your state
    const [isLoading, setIsLoading] = useState(false);

    const addReminder = useCallback(
        async (payload: reminderPyload) => {
            setIsLoading(true);
            const data: Data | false = await AddReminders({
                userId: id,
                userType: role,
                ...payload,
            });
            setIsLoading(false);

            return !!data;
        },
        [id, role]
    );

    return { addReminder, isLoading };
}
