import { useState, useCallback } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { fetchReminders } from '../../api/preReminder';
import { fetchData } from '../../types/preReminders';

export default function useFetchReminders() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [reminders, setReminders] = useState<fetchData | null>(null);

    const getReminders = useCallback(async () => {
        setIsLoading(true);

        const data = await fetchReminders({ userId: id, userType: role });

        if (data) {
            setReminders(data);
        }

        setIsLoading(false);
    }, [id, role]);

    return { reminders, getReminders, isLoading };
}
