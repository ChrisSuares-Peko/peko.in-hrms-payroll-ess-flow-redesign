import { useCallback, useEffect, useState } from 'react';

import dayjs from 'dayjs';

import { useAppSelector } from '@src/hooks/store';

import { getDailyAttendanceLog } from '../../api/dashBoardIndex';
import type { DailyLogEntry, DailyLogPagination } from '../../types/dashboardTypes';
import type { AttendanceStatus, TimesheetRecord } from '../../utils/timesheet/data';

const API_TO_UI_STATUS: Record<string, AttendanceStatus> = {
    present: 'Present',
    late: 'Late',
    absent: 'Absent',
    'on-leave': 'On Leave',
    'half-day': 'Half Day',
};

const getInitials = (name: string) =>
    name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(w => w[0]?.toUpperCase() ?? '')
        .join('');

const formatTime = (iso?: string) => (iso ? dayjs(iso).format('hh:mm A') : '--');

const formatWorkHours = (hrs?: number) => {
    if (hrs == null) return '--';
    const h = Math.floor(hrs);
    const m = Math.round((hrs - h) * 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

const toRecord = (entry: DailyLogEntry, index: number): TimesheetRecord => ({
    key: entry._id ?? String(index),
    employeeId: entry.employee._id,
    name: entry.employee.fullName,
    email: entry.employee.email ?? '',
    initials: getInitials(entry.employee.fullName),
    profileImage: entry.employee.profileImage,
    color: '#1677ff',
    date: dayjs(entry.date).format('DD MMM YYYY'),
    shift: entry.employee.shift ?? '--',
    checkIn: formatTime(entry.checkIn),
    checkOut: formatTime(entry.checkOut),
    workHrs: formatWorkHours(entry.totalHours),
    otHours: formatWorkHours(entry.otHours),
    lateMinutes: entry.lateMinutes,
    status: API_TO_UI_STATUS[entry.status] ?? 'Present',
    rawDate: dayjs(entry.date).format('YYYY-MM-DD'),
    rawCheckIn: entry.checkIn ? dayjs(entry.checkIn).format('HH:mm') : '',
    rawCheckOut: entry.checkOut ? dayjs(entry.checkOut).format('HH:mm') : '',
    rawStatus: entry.status,
    rawNotes: entry.notes ?? '',
});

export type DailyLogFilters = {
    from?: string;
    to?: string;
    search?: string;
    status?: string;
    employee?: string;
    page: number;
};

const DEFAULT_PAGINATION: DailyLogPagination = {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
};

export function useDailyLog(filters: DailyLogFilters) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [rows, setRows] = useState<TimesheetRecord[]>([]);
    const [pagination, setPagination] = useState<DailyLogPagination>(DEFAULT_PAGINATION);
    const [isLoading, setIsLoading] = useState(false);

    const { from, to, search, status, employee, page } = filters;

    const load = useCallback(async () => {
        setIsLoading(true);
        const result = await getDailyAttendanceLog({
            userType: role,
            userId: id,
            from,
            to,
            search,
            status,
            employee,
            page,
            limit: 10,
        });
        if (result) {
            setRows((result.entries ?? []).map((entry, i) => toRecord(entry, i)));
            setPagination(result.pagination ?? DEFAULT_PAGINATION);
        } else {
            setRows([]);
            setPagination(DEFAULT_PAGINATION);
        }
        setIsLoading(false);
    }, [role, id, from, to, search, status, employee, page]);

    useEffect(() => {
        load();
    }, [load]);

    return { rows, pagination, isLoading, refetch: load };
}
