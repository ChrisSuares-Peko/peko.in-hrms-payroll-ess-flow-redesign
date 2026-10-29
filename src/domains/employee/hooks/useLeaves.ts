import { useCallback, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    ApplyLeaveBody,
    applyLeaveApi,
    cancelLeaveApi,
    getHolidays,
    getLeaveBalance,
    getMyLeaves,
} from '../api/leaves';
import { AvailableLeave, HolidayDoc, LeaveDoc } from '../types';

const PAGE_SIZE = 10;

export const useLeaves = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [availableLeaves, setAvailableLeaves] = useState<AvailableLeave[]>([]);
    const [leaves, setLeaves] = useState<LeaveDoc[]>([]);
    const [leavesTotal, setLeavesTotal] = useState(0);
    const [holidays, setHolidays] = useState<HolidayDoc[]>([]);
    const [holidaysTotal, setHolidaysTotal] = useState(0);

    const fetchBalance = useCallback(async () => {
        const balance = await getLeaveBalance({ userType: role, userId: id });
        setAvailableLeaves(balance);
    }, [role, id]);

    const fetchLeaves = useCallback(
        async (params: { status?: string; page?: number } = {}) => {
            const { records, total } = await getMyLeaves(
                { userType: role, userId: id },
                { ...params, page: params.page ?? 1, limit: PAGE_SIZE }
            );
            setLeaves(records);
            setLeavesTotal(total);
        },
        [role, id]
    );

    const fetchHolidays = useCallback(
        async (params: { category?: string; page?: number } = {}) => {
            const { holidays: records, total } = await getHolidays(
                { userType: role, userId: id },
                { ...params, page: params.page ?? 1, limit: PAGE_SIZE }
            );
            setHolidays(records);
            setHolidaysTotal(total);
        },
        [role, id]
    );

    const applyLeave = useCallback(
        async (body: ApplyLeaveBody) => {
            try {
                await applyLeaveApi({ userType: role, userId: id }, body);
                await Promise.all([fetchLeaves(), fetchBalance()]);
                dispatch(
                    showToast({
                        description: 'Leave request submitted successfully.',
                        variant: 'success',
                    })
                );
                return true;
            } catch (err: any) {
                dispatch(
                    showToast({
                        description: err?.response?.data?.message || 'Something went wrong.',
                        variant: 'error',
                    })
                );
                return false;
            }
        },
        [role, id, fetchLeaves, fetchBalance, dispatch]
    );

    const cancelLeave = useCallback(
        async (leaveId: string) => {
            try {
                await cancelLeaveApi({ userType: role, userId: id }, leaveId);
                await Promise.all([fetchLeaves(), fetchBalance()]);
                return true;
            } catch (err: any) {
                dispatch(
                    showToast({
                        description: err?.response?.data?.message || 'Something went wrong.',
                        variant: 'error',
                    })
                );
                return false;
            }
        },
        [role, id, fetchLeaves, fetchBalance, dispatch]
    );

    return {
        availableLeaves,
        leaves,
        leavesTotal,
        leavesLimit: PAGE_SIZE,
        holidays,
        holidaysTotal,
        holidaysLimit: PAGE_SIZE,
        fetchBalance,
        fetchLeaves,
        fetchHolidays,
        applyLeave,
        cancelLeave,
    };
};
