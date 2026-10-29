import { useCallback, useEffect, useRef, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { fetchReminderDashboard } from '../../api/reminder';
import type { ReminderApiRow } from '../../types/api/reminder';
import type { ReminderChannel, ReminderFilters, ReminderRow, ReminderStats } from '../../types/page-props/reminders';

const STATUS_MAP: Record<string, ReminderRow['status']> = {
    PENDING: 'Pending',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
};

const toReminderRow = (row: ReminderApiRow): ReminderRow => {
    const channels: ReminderChannel[] = [];
    if (row.email) channels.push('email');
    if (row.sms) channels.push('sms');

    const inv = (row as any).invoicing ?? (row as any).invoice;
    return {
        id: row.id,
        scheduledDate: row.actionDate,
        invoiceNo: `${inv?.prefix ?? ''}${inv?.invoiceNumber ?? ''}`,
        customerName: inv?.name ?? '',
        customerEmail: inv?.email ?? '',
        amountDue: parseFloat(inv?.amountDue ?? '0'),
        totalAmount: parseFloat(inv?.totalAmount ?? '0'),
        currency: inv?.currency ?? 'INR',
        channels,
        invoiceStatus: inv?.status ?? '',
        status: STATUS_MAP[row.status] ?? 'Pending',
    };
};

const EMPTY_STATS: ReminderStats = { pending: 0, completed: 0, cancelled: 0 };

export const useReminderData = (filters: ReminderFilters) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const [reminders, setReminders] = useState<ReminderRow[]>([]);
    const [recordsTotal, setRecordsTotal] = useState(0);
    const [stats, setStats] = useState<ReminderStats>(EMPTY_STATS);
    const [isLoading, setIsLoading] = useState(false);
    const fetchRef = useRef(0);

    const fetchData = useCallback(async () => {
        fetchRef.current += 1;
        const token = fetchRef.current;
        setIsLoading(true);

        const result = await fetchReminderDashboard({
            userId: id,
            userType: role,
            page: filters.page,
            itemsPerPage: filters.itemsPerPage,
            status: filters.status || undefined,
            searchText: filters.searchText || undefined,
            sort: filters.sort,
            sortField: filters.sortField || undefined,
            from: filters.startDate || undefined,
            to: filters.endDate || undefined,
        });

        if (token !== fetchRef.current) return;

        if (result) {
            setReminders(result.rows.map(toReminderRow));
            setRecordsTotal(result.recordsTotal);
            setStats(result.stats);
        }
        setIsLoading(false);
    }, [
        id,
        role,
        filters.page,
        filters.itemsPerPage,
        filters.status,
        filters.searchText,
        filters.sort,
        filters.sortField,
        filters.startDate,
        filters.endDate,
    ]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { reminders, recordsTotal, stats, isLoading, refetch: fetchData };
};
