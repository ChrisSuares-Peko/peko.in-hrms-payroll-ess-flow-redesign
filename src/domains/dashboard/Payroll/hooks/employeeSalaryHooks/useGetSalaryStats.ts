import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import {
    listSalaryRolloutEmployees,
    listSalaryRolloutPastEmployees,
} from '../../api/employeeSalaryApi/salaryRolloutApi';
import { getSalaryStats } from '../../api/salaryHistoryApi/salaryStats';
import { SalaryStatsRecord } from '../../types/salaryStats';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const PAGE_SIZE = 10;

const buildSalaryMap = (salaries: { month: number; amount: number }[] = []) =>
    (Array.isArray(salaries) ? salaries : []).reduce<Record<string, number>>((acc, s) => {
        const monthKey = MONTHS[s.month - 1];
        const amount = Number(s.amount);
        if (monthKey && Number.isFinite(amount)) acc[monthKey] = amount;
        return acc;
    }, {});

export const useGetSalaryStats = (params: {
    year: string | number;
    status: 'ACTIVE' | 'PAST' | 'INACTIVE';
    page: number;
    searchText?: string;
}) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [rows, setRows] = useState<SalaryStatsRecord[]>([]);
    const [count, setCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const { year, status, page, searchText } = params;

    const fetchSalaryStats = useCallback(async () => {
        setIsLoading(true);
        try {
            const isPast = status === 'PAST' || status === 'INACTIVE';
            const [employeeRes, statsRes] = await Promise.all([
                isPast
                    ? listSalaryRolloutPastEmployees({
                          userId: String(id),
                          userType: role,
                          page,
                          limit: PAGE_SIZE,
                          search: searchText || undefined,
                      })
                    : listSalaryRolloutEmployees({
                          userId: String(id),
                          userType: role,
                          page,
                          limit: PAGE_SIZE,
                          search: searchText || undefined,
                      }),
                getSalaryStats({
                    userId: id,
                    userType: role,
                    year,
                    status,
                    page: 1,
                    limit: 10000,
                    searchText,
                }),
            ]);

            if (employeeRes && Array.isArray(employeeRes.rows)) {
                const salaryRowsByEmployeeId = new Map(
                    (statsRes && Array.isArray(statsRes.rows) ? statsRes.rows : []).map(item => [
                        item.employeeId,
                        item.salaries,
                    ])
                );

                const mapped: SalaryStatsRecord[] = employeeRes.rows.map(employee => {
                    const employeeId = employee.id;
                    const employeeCode = employee.employeeId;
                    const employeeName = employee.fullName;
                    return {
                        key: employeeId,
                        empId: employeeCode ?? employeeId,
                        name: employeeName ?? 'Unknown',
                        salaries: buildSalaryMap(salaryRowsByEmployeeId.get(employeeId)),
                    };
                });

                setRows(mapped);
                setCount(Number(employeeRes.count) || 0);
            } else {
                setRows([]);
                setCount(0);
            }
        } catch {
            setRows([]);
            setCount(0);
        } finally {
            setIsLoading(false);
        }
    }, [role, id, year, status, page, searchText]);

    useEffect(() => {
        fetchSalaryStats();
    }, [fetchSalaryStats]);

    return { rows, count, isLoading, refetch: fetchSalaryStats };
};
