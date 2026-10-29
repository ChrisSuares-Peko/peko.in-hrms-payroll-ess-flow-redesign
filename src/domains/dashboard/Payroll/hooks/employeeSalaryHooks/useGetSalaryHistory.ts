import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getSalaryHistory } from '../../api/salaryHistoryApi/salaryHistory';
import { SalaryHistoryRecord } from '../../utils/salaryHistory/columns';

export const useGetSalaryHistory = (year: string, page: number, limit: number, enabled = true) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [rows, setRows] = useState<SalaryHistoryRecord[]>([]);
    const [count, setCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const fetchSalaryHistory = useCallback(async () => {
        if (!enabled || !year) {
            setRows([]);
            setCount(0);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const res = await getSalaryHistory({ userType: role, userId: id, year, page, limit });
        if (res) {
            const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            const mapped: SalaryHistoryRecord[] = res.rows.map((item, index) => ({
                key: String((page - 1) * limit + index + 1),
                month: `${MONTH_NAMES[item.month - 1]} ${item.year}`,
                monthNumber: item.month,
                year: item.year,
                employees: item.totalEmployees,
                salariesProcessed: item.salariesProcessed,
                totalPayout: item.totalPayroll,
                status: item.salaryStatus ?? '',
            }));
            setRows(mapped);
            setCount(res.count);
        } else {
            setRows([]);
            setCount(0);
        }
        setIsLoading(false);
    }, [enabled, role, id, year, page, limit]);

    useEffect(() => {
        fetchSalaryHistory();
    }, [fetchSalaryHistory]);

    return { rows, count, isLoading, refetch: fetchSalaryHistory };
};
