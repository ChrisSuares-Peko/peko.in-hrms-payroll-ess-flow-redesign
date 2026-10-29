import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getMonthlySummary } from '../../api/dashBoardIndex';
import type { DailyLogPagination } from '../../types/dashboardTypes';
import type { MonthlySummaryRecord } from '../../utils/timesheet/monthlySummaryData';

const DEFAULT_PAGINATION: DailyLogPagination = { total: 0, page: 1, limit: 10, totalPages: 0 };

const getInitials = (name: string) =>
    name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(w => w[0]?.toUpperCase() ?? '')
        .join('');

const formatHours = (hrs: number) => {
    const h = Math.floor(hrs);
    const m = Math.round((hrs - h) * 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

export type MonthlySummaryFilters = {
    month?: string;
    employee?: string;
    search?: string;
    page: number;
};

export function useMonthlySummary(filters: MonthlySummaryFilters) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [rows, setRows] = useState<MonthlySummaryRecord[]>([]);
    const [pagination, setPagination] = useState<DailyLogPagination>(DEFAULT_PAGINATION);
    const [isLoading, setIsLoading] = useState(false);

    const { month, employee, search, page } = filters;

    const load = useCallback(async () => {
        setIsLoading(true);
        const result = await getMonthlySummary({
            userType: role,
            userId: id,
            month,
            employee,
            search,
            page,
            limit: 10,
        });
        if (result) {
            const mapped: MonthlySummaryRecord[] = (result.entries ?? []).map(entry => ({
                key: entry.employee._id,
                name: entry.employee.fullName,
                email: entry.employee.email ?? '',
                initials: getInitials(entry.employee.fullName),
                profileImage: entry.employee.profileImage,
                designation: entry.employee.designation,
                present: entry.present,
                late: entry.late,
                absent: entry.absent,
                onLeave: entry.onLeave,
                otHours: formatHours(entry.otHours),
                totalHours: formatHours(entry.totalHours),
                attendancePct: entry.attendancePercentage,
            }));
            setRows(mapped);
            setPagination(result.pagination ?? DEFAULT_PAGINATION);
        } else {
            setRows([]);
            setPagination(DEFAULT_PAGINATION);
        }
        setIsLoading(false);
    }, [role, id, month, employee, search, page]);

    useEffect(() => {
        load();
    }, [load]);

    return { rows, pagination, isLoading, refetch: load };
}
