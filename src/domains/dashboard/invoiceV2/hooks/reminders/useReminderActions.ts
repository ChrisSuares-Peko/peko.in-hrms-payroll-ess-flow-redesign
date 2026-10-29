import { useCallback, useState } from 'react';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { cancelReminder, sendReminder } from '../../api/reminder';
import type { ReminderRow } from '../../types/page-props/reminders';

type ActingState = { id: number; action: 'send' | 'cancel' } | null;

export const useReminderActions = (refetch: () => void) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [acting, setActing] = useState<ActingState>(null);

    const onSend = useCallback(
        async (row: ReminderRow) => {
            setActing({ id: row.id, action: 'send' });
            const success = await sendReminder({ userId: id, userType: role, id: row.id });
            if (success) {
                dispatch(showToast({ description: 'Reminder sent successfully', variant: 'success' }));
                refetch();
            } else {
                dispatch(showToast({ description: 'Failed to send reminder', variant: 'error' }));
            }
            setActing(null);
        },
        [id, role, refetch, dispatch]
    );

    const onCancel = useCallback(
        async (row: ReminderRow) => {
            setActing({ id: row.id, action: 'cancel' });
            const success = await cancelReminder({ userId: id, userType: role, id: row.id });
            if (success) {
                dispatch(showToast({ description: 'Reminder cancelled successfully', variant: 'success' }));
                refetch();
            } else {
                dispatch(showToast({ description: 'Failed to cancel reminder', variant: 'error' }));
            }
            setActing(null);
        },
        [id, role, refetch, dispatch]
    );

    return { onSend, onCancel, acting };
};
