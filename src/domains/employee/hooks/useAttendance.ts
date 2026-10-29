import { useCallback, useState } from 'react';

import dayjs from 'dayjs';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { AttendanceApiRecord, getAttendanceList } from '../api/attendance';
import { raiseDisputeApi } from '../api/disputes';
import { AttendanceUiRow, UiAttendanceStatus, formatHours } from '../utils/attendanceMappers';

const STATUS_TO_UI: Record<AttendanceApiRecord['status'], UiAttendanceStatus> = {
    present: 'Present',
    late: 'Late',
    absent: 'Absent',
    'on-leave': 'Leave',
    'half-day': 'Half Day',
};

const toRow = (record: AttendanceApiRecord): AttendanceUiRow => ({
    key: record._id,
    date: dayjs(record.date).format('ddd MMM D'),
    rawDate: dayjs(record.date).format('YYYY-MM-DD'),
    checkIn: record.checkIn?.time ? dayjs(record.checkIn.time).format('HH:mm') : null,
    checkOut: record.checkOut?.time ? dayjs(record.checkOut.time).format('HH:mm') : null,
    hours: formatHours(record.totalHours),
    status: STATUS_TO_UI[record.status] ?? 'Absent',
    isLate: record.status === 'late',
    lateMinutes: record.lateMinutes,
    disputeRaised: !!record.disputeRaised,
    disputeStatus: record.disputeStatus,
});

const PAGE_SIZE = 10;

export const useAttendance = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [records, setRecords] = useState<AttendanceUiRow[]>([]);
    const [total, setTotal] = useState(0);

    const fetchAttendance = useCallback(
        async (params: { from?: string; to?: string; status?: string; page?: number }) => {
            const { records: apiRecords, total: apiTotal } = await getAttendanceList(
                { userType: role, userId: id },
                {
                    from: params.from,
                    to: params.to,
                    status: params.status,
                    page: params.page ?? 1,
                    limit: PAGE_SIZE,
                }
            );
            setRecords(apiRecords.map(toRow));
            setTotal(apiTotal);
        },
        [role, id]
    );

    const raiseDispute = useCallback(
        async (attendanceId: string, reason: string) => {
            try {
                await raiseDisputeApi({ userType: role, userId: id }, { attendanceId, reason });
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
        [role, id, dispatch]
    );

    return { records, total, limit: PAGE_SIZE, fetchAttendance, raiseDispute };
};
