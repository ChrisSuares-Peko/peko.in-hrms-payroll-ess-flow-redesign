import { useCallback, useEffect, useState } from 'react';

import dayjs from 'dayjs';

import { useAppSelector } from '@src/hooks/store';

import { getHolidaysList } from '../../api/dashBoardIndex';
import type { DailyLogPagination } from '../../types/dashboardTypes';
import type { HolidayRecord, HolidayType } from '../../utils/timesheet/holidaysData';

const CATEGORY_TO_TYPE: Record<string, HolidayType> = {
    public: 'Public Holiday',
    optional: 'Optional Holiday',
    restricted: 'Restricted Holiday',
};

const DEFAULT_PAGINATION: DailyLogPagination = { total: 0, page: 1, limit: 10, totalPages: 0 };

export type HolidaysListFilters = {
    page: number;
    start?: string;
    end?: string;
    search?: string;
    category?: string;
};

export function useHolidaysList(filters: HolidaysListFilters) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [rows, setRows] = useState<HolidayRecord[]>([]);
    const [pagination, setPagination] = useState<DailyLogPagination>(DEFAULT_PAGINATION);
    const [isLoading, setIsLoading] = useState(false);

    const { page, start, end, search, category } = filters;

    const load = useCallback(async () => {
        setIsLoading(true);
        const result = await getHolidaysList({ userType: role, userId: id, page, limit: 10, start, end, search, category });
        if (result) {
            setRows(
                result.holidays.map(h => ({
                    key: h._id,
                    name: h.title,
                    type: CATEGORY_TO_TYPE[h.category] ?? 'Public Holiday',
                    date: dayjs(h.start).format('DD-MM-YYYY'),
                    day: dayjs(h.start).format('dddd'),
                    rawStart: h.start,
                    rawEnd: h.end,
                    rawCategory: h.category,
                    rawSendPriorEmailDate: h.sendPriorEmailDate,
                }))
            );
            setPagination(result.pagination ?? DEFAULT_PAGINATION);
        } else {
            setRows([]);
            setPagination(DEFAULT_PAGINATION);
        }
        setIsLoading(false);
    }, [role, id, page, start, end, search, category]);

    useEffect(() => {
        load();
    }, [load]);

    return { rows, pagination, isLoading, refetch: load };
}
