import { useCallback, useEffect, useState } from 'react';

import dayjs from 'dayjs';

import { useAppSelector } from '@src/hooks/store';

import { getDisputeRequests } from '../../api/dashBoardIndex';
import type { DailyLogPagination } from '../../types/dashboardTypes';
import type { DisputeRecord, DisputeStatus } from '../../utils/timesheet/disputeData';

const API_TO_UI_STATUS: Record<string, DisputeStatus> = {
    requestedByEmployee: 'pending',
    approved: 'approved',
    rejected: 'rejected',
};

const formatTime = (entry?: { time?: string } | null) =>
    entry?.time ? dayjs(entry.time).format('hh:mm A') : '--';

const getInitials = (name: string) =>
    name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');

const DEFAULT_PAGINATION: DailyLogPagination = { total: 0, page: 1, limit: 10, totalPages: 0 };

export type DisputeFilters = {
    page: number;
    from?: string;
    to?: string;
    status?: string;
    employee?: string;
    search?: string;
    reason?: string;
};

export function useDisputeRequests(filters: DisputeFilters) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [rows, setRows] = useState<DisputeRecord[]>([]);
    const [pagination, setPagination] = useState<DailyLogPagination>(DEFAULT_PAGINATION);
    const [isLoading, setIsLoading] = useState(false);

    const { page, from, to, status, employee, search, reason } = filters;

    const load = useCallback(async () => {
        setIsLoading(true);
        const result = await getDisputeRequests({
            userType: role, userId: id, page, limit: 10, from, to, status, employee, search, reason,
        });
        if (result) {
            setRows(result.entries.map(e => ({
                key: e._id,
                name: e.employee.fullName,
                email: e.employee.email,
                initials: getInitials(e.employee.fullName),
                profileImage: e.employee.profileImage,
                date: dayjs(e.attendance.date).format('DD MMM YYYY'),
                disputeType: e.disputeType,
                checkIn: formatTime(e.attendance.checkIn ?? null),
                checkOut: formatTime(e.attendance.checkOut ?? null),
                reason: e.reason,
                status: API_TO_UI_STATUS[e.status] ?? 'pending',
                submittedOn: dayjs(e.createdAt).format('DD MMM YYYY'),
                remarks: e.remarks,
            })));
            setPagination(result.pagination ?? DEFAULT_PAGINATION);
        } else {
            setRows([]);
            setPagination(DEFAULT_PAGINATION);
        }
        setIsLoading(false);
    }, [role, id, page, from, to, status, employee, search, reason]);

    useEffect(() => {
        load();
    }, [load]);

    return { rows, pagination, isLoading, refetch: load };
}
