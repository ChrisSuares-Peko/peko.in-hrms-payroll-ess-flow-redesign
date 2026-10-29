import { useCallback, useEffect, useState } from 'react';

import dayjs from 'dayjs';
import { useDispatch } from 'react-redux';

import { useAppSelector } from '@src/hooks/store';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { showToast } from '@src/slices/apiSlice';

import { fetchRecurringList, updateRecurringStatus } from '../../../api/recurring';
import type {
    RecurringListStats,
    RecurringScheduleApiData,
    RecurringScheduleStatus,
} from '../../../types/recurring';

type RecurringStatusFilter = 'ALL' | RecurringScheduleStatus;

const DEFAULT_STATS: RecurringListStats = { totalSchedule: 0, active: 0, revenueGenerated: 0 };

export const useRecurringList = () => {
    const { role, id } = useAppSelector(s => s.reducer.auth);
    const dispatch = useDispatch();

    const [schedules, setSchedules] = useState<RecurringScheduleApiData[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [stats, setStats] = useState<RecurringListStats>(DEFAULT_STATS);

    const [filters, setFilters] = useState({
        searchText: '',
        page: 1,
        pageSize: 10,
        status: 'ALL' as RecurringStatusFilter,
        from: dayjs().startOf('month').format('YYYY-MM-DD'),
        to: dayjs().endOf('month').format('YYYY-MM-DD'),
    });

    const { searchText, updateSearchText } = useDebounceSearch(setFilters);

    const [isPausing, setIsPausing] = useState(false);
    const [isResuming, setIsResuming] = useState(false);

    const fetchTableData = useCallback(async () => {
        setIsLoading(true);
        const result = await fetchRecurringList({
            userId: id,
            userType: role,
            page: filters.page,
            itemsPerPage: filters.pageSize,
            status: filters.status !== 'ALL' ? filters.status : undefined,
            searchText: filters.searchText || undefined,
            from: filters.from,
            to: filters.to,
        });
        if (result) {
            setSchedules(result.rows);
            setTotal(result.recordsTotal);
            setStats(result.stats);
        }
        setIsLoading(false);
    }, [id, role, filters]);

    useEffect(() => {
        fetchTableData();
    }, [fetchTableData]);

    const setStatusFilter = useCallback((v: RecurringStatusFilter) => {
        setFilters(prev => ({ ...prev, status: v, page: 1 }));
    }, []);

    const setRange = useCallback((val: [dayjs.Dayjs, dayjs.Dayjs] | null) => {
        setFilters(prev => ({
            ...prev,
            from: val?.[0]?.format('YYYY-MM-DD') ?? '',
            to: val?.[1]?.format('YYYY-MM-DD') ?? '',
            page: 1,
        }));
    }, []);

    const setPage = useCallback((p: number) => {
        setFilters(prev => ({ ...prev, page: p }));
    }, []);

    const setPageSize = useCallback((ps: number) => {
        setFilters(prev => ({ ...prev, pageSize: ps }));
    }, []);

    const handlePause = useCallback(
        async (recurringId: string) => {
            setIsPausing(true);
            const ok = await updateRecurringStatus({
                userId: id,
                userType: role,
                recurringId,
                status: 'PAUSED',
            });
            if (ok) {
                setSchedules(prev =>
                    prev.map(s => (s.id === recurringId ? { ...s, status: 'PAUSED' as const } : s))
                );
                dispatch(showToast({ description: 'Schedule paused', variant: 'success' }));
            } else {
                dispatch(showToast({ description: 'Failed to pause schedule', variant: 'error' }));
            }
            setIsPausing(false);
        },
        [id, role, dispatch]
    );

    const handleResume = useCallback(
        async (recurringId: string) => {
            setIsResuming(true);
            const ok = await updateRecurringStatus({
                userId: id,
                userType: role,
                recurringId,
                status: 'ACTIVE',
            });
            if (ok) {
                setSchedules(prev =>
                    prev.map(s => (s.id === recurringId ? { ...s, status: 'ACTIVE' as const } : s))
                );
                dispatch(showToast({ description: 'Schedule resumed', variant: 'success' }));
            } else {
                dispatch(showToast({ description: 'Failed to resume schedule', variant: 'error' }));
            }
            setIsResuming(false);
        },
        [id, role, dispatch]
    );

    const range: [dayjs.Dayjs, dayjs.Dayjs] | null =
        filters.from && filters.to ? [dayjs(filters.from), dayjs(filters.to)] : null;

    return {
        schedules,
        total,
        isLoading,
        stats,
        search: searchText,
        updateSearchText,
        statusFilter: filters.status,
        setStatusFilter,
        range,
        setRange,
        page: filters.page,
        setPage,
        pageSize: filters.pageSize,
        setPageSize,
        isPausing,
        isResuming,
        handlePause,
        handleResume,
        refetch: fetchTableData,
    };
};

export default useRecurringList;
