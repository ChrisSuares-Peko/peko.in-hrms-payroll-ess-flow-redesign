import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getLeaveRequests } from '../../api/dashBoardIndex';
import type { DailyLogPagination } from '../../types/dashboardTypes';
import type { LeaveRequestRecord, LeaveStatus } from '../../utils/timesheet/leaveRequestsData';

const DEFAULT_PAGINATION: DailyLogPagination = { total: 0, page: 1, limit: 10, totalPages: 0 };

const STATUS_MAP: Record<string, LeaveStatus> = {
    applied: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    cancelledByEmployee: 'Cancelled',
};

const getInitials = (name: string) =>
    name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(w => w[0]?.toUpperCase() ?? '')
        .join('');

const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

export type LeaveRequestFilters = {
    employee?: string;
    from?: string;
    to?: string;
    status?: string;
    search?: string;
    page: number;
};

export function useLeaveRequests(filters: LeaveRequestFilters) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [rows, setRows] = useState<LeaveRequestRecord[]>([]);
    const [pagination, setPagination] = useState<DailyLogPagination>(DEFAULT_PAGINATION);
    const [isLoading, setIsLoading] = useState(false);

    const { employee, from, to, status, search, page } = filters;

    const load = useCallback(async () => {
        setIsLoading(true);
        const result = await getLeaveRequests({
            userType: role,
            userId: id,
            employee,
            from,
            to,
            status,
            search,
            page,
            limit: 10,
        });
        if (result) {
            const mapped: LeaveRequestRecord[] = (result.entries ?? []).map(entry => ({
                key: entry._id,
                name: entry.employee.fullName,
                email: entry.employee.email,
                initials: getInitials(entry.employee.fullName),
                profileImage: entry.employee.profileImage,
                leaveType: entry.typeOfLeave?.leaveType ?? 'Leave',
                fromDate: formatDate(entry.start),
                toDate: formatDate(entry.end),
                duration: `${entry.leaveCount} day${entry.leaveCount !== 1 ? 's' : ''}`,
                reason: entry.reason ?? '--',
                appliedOn: formatDate(entry.createdAt),
                status: STATUS_MAP[entry.status] ?? 'Pending',
            }));
            setRows(mapped);
            setPagination(result.pagination ?? DEFAULT_PAGINATION);
        } else {
            setRows([]);
            setPagination(DEFAULT_PAGINATION);
        }
        setIsLoading(false);
    }, [role, id, employee, from, to, status, search, page]);

    useEffect(() => {
        load();
    }, [load]);

    return { rows, pagination, isLoading, refetch: load };
}
