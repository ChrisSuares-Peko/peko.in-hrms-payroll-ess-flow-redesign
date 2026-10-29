import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getShiftSchedule } from '../../api/dashBoardIndex';
import { getDefaultWorkSchedule } from '../../api/essSettings';
import type {
    ShiftScheduleRecord,
    ShiftSlot,
    ShiftStatus,
} from '../../utils/timesheet/shiftScheduleData';

const LIMIT = 10;

const getInitials = (name: string) =>
    name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(w => w[0]?.toUpperCase() ?? '')
        .join('');

const formatDayLabel = (dateStr: string) => {
    const d = new Date(`${dateStr}T00:00:00Z`);
    const weekday = d.toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' });
    return `${weekday} ${d.getUTCDate()}`;
};

const formatTime = (iso: string | null): string | null => {
    if (!iso) return null;
    const match = iso.match(/T(\d{2}:\d{2})/);
    return match ? match[1] : null;
};

const calcScheduledHours = (start: string | null, end: string | null): string => {
    if (!start || !end) return '0 hrs';
    const parse = (t: string) => {
        const m = t.match(/(\d{1,2}):(\d{2})/);
        return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : null;
    };
    const s = parse(start);
    const e = parse(end);
    if (s === null || e === null) return '0 hrs';
    const diff = e >= s ? e - s : 24 * 60 - s + e;
    const hrs = diff / 60;
    return `${Number.isInteger(hrs) ? hrs : hrs.toFixed(1)} hrs`;
};

const mapStatus = (status: string, isOff: boolean): ShiftStatus => {
    if (isOff) return 'off';
    switch (status) {
        case 'present':
            return 'present';
        case 'late':
            return 'late';
        case 'absent':
            return 'absent';
        default:
            return 'present';
    }
};

export type ShiftScheduleFilters = {
    from?: string;
    to?: string;
    search?: string;
    page: number;
};

export function useShiftSchedule(filters: ShiftScheduleFilters) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [rows, setRows] = useState<ShiftScheduleRecord[]>([]);
    const [dayLabels, setDayLabels] = useState<string[]>([]);
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: LIMIT,
        totalPages: 1,
    });
    const [isLoading, setIsLoading] = useState(false);

    const { from, to, search, page } = filters;

    const load = useCallback(async () => {
        setIsLoading(true);
        const [result, scheduleResp] = await Promise.all([
            getShiftSchedule({ userType: role, userId: id, from, to, search, page, limit: LIMIT }),
            getDefaultWorkSchedule({ userId: id, userType: role }),
        ]);
        const defaultStart = scheduleResp
            ? (scheduleResp.defaultWorkSchedule?.checkInTime ?? null)
            : null;
        const defaultEnd = scheduleResp
            ? (scheduleResp.defaultWorkSchedule?.checkOutTime ?? null)
            : null;
        if (result) {
            const labels = (result.entries[0]?.days ?? []).map(d => formatDayLabel(d.date));
            setDayLabels(labels);
            setRows(
                result.entries.map(entry => {
                    const emp = entry.employee;
                    const entryStart = entry.scheduledStart || defaultStart;
                    const entryEnd = entry.scheduledEnd || defaultEnd;
                    const days: ShiftSlot[] = entry.days.map(d => ({
                        date: d.date,
                        dayLabel: formatDayLabel(d.date),
                        scheduledStart: d.scheduledStart || entryStart,
                        scheduledEnd: d.scheduledEnd || entryEnd,
                        checkIn: formatTime(d.checkIn),
                        checkOut: formatTime(d.checkOut),
                        totalHours: d.totalHours,
                        lateMinutes: d.lateMinutes,
                        status: mapStatus(d.status, d.isOff),
                    }));
                    return {
                        key: emp._id,
                        name: emp.fullName,
                        email: emp.email,
                        initials: getInitials(emp.fullName),
                        profileImage: emp.profileImage,
                        department: emp.department,
                        totalHours: calcScheduledHours(entryStart, entryEnd),
                        days,
                    };
                })
            );
            setPagination(result.pagination);
        } else {
            setRows([]);
            setDayLabels([]);
            setPagination({ total: 0, page: 1, limit: LIMIT, totalPages: 1 });
        }
        setIsLoading(false);
    }, [role, id, from, to, search, page]);

    useEffect(() => {
        load();
    }, [load]);

    return { rows, dayLabels, pagination, isLoading, refetch: load };
}
