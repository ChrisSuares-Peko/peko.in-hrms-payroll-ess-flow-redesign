import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getOvertime } from '../../api/dashBoardIndex';
import type { OvertimeRecord } from '../../utils/timesheet/overtimeData';

const LIMIT = 10;

const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

const getInitials = (name: string) =>
    name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(w => w[0]?.toUpperCase() ?? '')
        .join('');

export type OvertimeFilters = {
    status?: string;
    page: number;
};

export function useOvertime(filters: OvertimeFilters) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [rows, setRows] = useState<OvertimeRecord[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const { status, page } = filters;

    const load = useCallback(async () => {
        setIsLoading(true);
        const result = await getOvertime({
            userType: role,
            userId: id,
            status,
            page,
            limit: LIMIT,
        });
        if (result) {
            setRows(
                result.entries.map(entry => {
                    const emp = entry.employeeDetails ?? null;
                    return {
                        key: entry.id,
                        employeeId: entry.employee,
                        name: emp?.fullName ?? '--',
                        email: emp?.email ?? '',
                        initials: emp?.fullName ? getInitials(emp.fullName) : '--',
                        profileImage: emp?.profileImage ?? undefined,
                        date: formatDate(entry.overTimeDate),
                        rawDate: entry.overTimeDate,
                        extraHours: entry.extraHours,
                        overtimeRate: entry.overTimeRate,
                        totalWorkingHours: entry.totalWorkingHours,
                        hourlyRate: entry.hourlyRate,
                        overtimeAmount: entry.overTimeAmount,
                        paymentStatus: entry.paymentStatus,
                        status: entry.status,
                        notes: entry.notes,
                    };
                })
            );
            setTotalCount(result.totalCount);
        } else {
            setRows([]);
            setTotalCount(0);
        }
        setIsLoading(false);
    }, [role, id, status, page]);

    useEffect(() => {
        load();
    }, [load]);

    return { rows, totalCount, limit: LIMIT, isLoading, refetch: load };
}
