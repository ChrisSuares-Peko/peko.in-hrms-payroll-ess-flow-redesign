import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getMswipeRefunds, updateMswipeRefundStatus } from '../../api/mswipeRefunds';
import {
    MswipeRefund,
    MswipeRefundFilters,
    MswipeRefundStatusOption,
    UpdateMswipeRefundPayload,
} from '../../types/mswipeRefunds';

export default function useMswipeRefunds(filters: MswipeRefundFilters) {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [rows, setRows] = useState<MswipeRefund[]>([]);
    const [statuses, setStatuses] = useState<MswipeRefundStatusOption[]>([]);
    const [count, setCount] = useState(0);

    const fetchRefunds = useCallback(
        async (silent = false) => {
            if (!silent) setIsLoading(true);
            const data = await getMswipeRefunds({ userId: id, userType: role, ...filters });
            if (data) {
                setRows(data.rows ?? []);
                setStatuses(data.statuses ?? []);
                setCount(data.recordsTotal ?? 0);
            }
            setIsLoading(false);
        },
        [id, role, filters]
    );

    useEffect(() => {
        fetchRefunds();
    }, [fetchRefunds]);

    const updateStatus = useCallback(
        async (payload: UpdateMswipeRefundPayload) => {
            setIsUpdating(true);
            const updated = await updateMswipeRefundStatus({
                userId: id,
                userType: role,
                ...payload,
            });
            setIsUpdating(false);
            if (updated) {
                dispatch(
                    showToast({
                        description: 'Refund status updated successfully',
                        variant: 'success',
                    })
                );
            }
            fetchRefunds(true);
            return updated;
        },
        [dispatch, fetchRefunds, id, role]
    );

    return { rows, statuses, count, isLoading, isUpdating, updateStatus };
}
