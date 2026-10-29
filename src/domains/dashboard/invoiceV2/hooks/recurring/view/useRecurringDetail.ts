import { useCallback, useEffect, useState } from 'react';

import { useDispatch } from 'react-redux';

import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { fetchRecurringScheduleById, updateRecurringStatus } from '../../../api/recurring';
import type { RecurringScheduleApiData, RecurringScheduleStatus } from '../../../types/recurring';

export const useRecurringDetail = (recurringId: string | null) => {
    const { role, id } = useAppSelector(s => s.reducer.auth);
    const dispatch = useDispatch();

    const [schedule, setSchedule] = useState<RecurringScheduleApiData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isActioning, setIsActioning] = useState(false);

    const loadDetail = useCallback(async () => {
        if (!recurringId || !id || !role) return;
        setIsLoading(true);
        const result = await fetchRecurringScheduleById({
            userId: id,
            userType: role,
            recurringId,
        });
        if (result) {
            setSchedule(result);
        } else {
            dispatch(
                showToast({ description: 'Failed to load recurring schedule', variant: 'error' })
            );
        }
        setIsLoading(false);
    }, [recurringId, id, role, dispatch]);

    useEffect(() => {
        loadDetail();
    }, [loadDetail]);

    const changeStatus = useCallback(
        async (status: RecurringScheduleStatus, successMsg: string, failMsg: string) => {
            if (!recurringId || !id || !role) return;
            setIsActioning(true);
            const ok = await updateRecurringStatus({
                userId: id,
                userType: role,
                recurringId,
                status,
            });
            if (ok) {
                setSchedule(prev => (prev ? { ...prev, status } : prev));
                dispatch(showToast({ description: successMsg, variant: 'success' }));
            } else {
                dispatch(showToast({ description: failMsg, variant: 'error' }));
            }
            setIsActioning(false);
        },
        [recurringId, id, role, dispatch]
    );

    const handlePause = useCallback(
        () => changeStatus('PAUSED', 'Schedule paused', 'Failed to pause schedule'),
        [changeStatus]
    );

    const handleResume = useCallback(
        () => changeStatus('ACTIVE', 'Schedule resumed', 'Failed to resume schedule'),
        [changeStatus]
    );

    const handleEnd = useCallback(
        () => changeStatus('ENDED', 'Schedule ended', 'Failed to end schedule'),
        [changeStatus]
    );

    return {
        schedule,
        isLoading,
        isActioning,
        handlePause,
        handleResume,
        handleEnd,
        refetch: loadDetail,
    };
};

export default useRecurringDetail;
