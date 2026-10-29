import { useCallback, useState } from 'react';

import dayjs from 'dayjs';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    OvertimeApiRecord,
    OvertimeSummary,
    RequestOvertimeBody,
    cancelOvertimeApi,
    getMyOvertime,
    requestOvertimeApi,
} from '../api/overtime';
import { OvertimeUiRow, UiOvertimeStatus } from '../utils/overtimeMappers';

const STATUS_TO_UI: Record<OvertimeApiRecord['status'], UiOvertimeStatus> = {
    requestedByEmployee: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    cancelledByEmployee: 'Cancelled',
};

const toRow = (record: OvertimeApiRecord): OvertimeUiRow => ({
    key: record.id,
    date: dayjs(record.overTimeDate).format('ddd MMM D'),
    rawDate: dayjs(record.overTimeDate).format('YYYY-MM-DD'),
    hours: `${record.extraHours} hrs`,
    description: record.notes || '—',
    status: STATUS_TO_UI[record.status] ?? 'Pending',
    canCancel: record.status === 'requestedByEmployee',
});

const PAGE_SIZE = 10;
const EMPTY_SUMMARY: OvertimeSummary = { totalOtHours: 0, approvedCount: 0, pendingCount: 0 };

export const useOvertime = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [records, setRecords] = useState<OvertimeUiRow[]>([]);
    const [total, setTotal] = useState(0);
    const [summary, setSummary] = useState<OvertimeSummary>(EMPTY_SUMMARY);

    const fetchOvertime = useCallback(
        async (params: { from?: string; to?: string; status?: string; page?: number }) => {
            const response = await getMyOvertime(
                { userType: role, userId: id },
                { ...params, page: params.page ?? 1, limit: PAGE_SIZE }
            );
            if (response) {
                setRecords(response.records.map(toRow));
                setTotal(response.total);
                setSummary(response.summary ?? EMPTY_SUMMARY);
            }
        },
        [role, id]
    );

    const requestOvertime = useCallback(
        async (body: RequestOvertimeBody) => {
            try {
                await requestOvertimeApi({ userType: role, userId: id }, body);
                await fetchOvertime({});
                dispatch(
                    showToast({
                        description: 'Overtime request submitted successfully.',
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
        [role, id, fetchOvertime, dispatch]
    );

    const cancelOvertime = useCallback(
        async (overtimeId: string) => {
            try {
                await cancelOvertimeApi({ userType: role, userId: id }, overtimeId);
                await fetchOvertime({});
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
        [role, id, fetchOvertime, dispatch]
    );

    return {
        records,
        total,
        summary,
        limit: PAGE_SIZE,
        fetchOvertime,
        requestOvertime,
        cancelOvertime,
    };
};
