import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getSalaryHistoryDetail, SalaryHistoryDetailSummary } from '../../api/salaryHistoryApi/salaryHistoryDetail';
import { DetailRecord } from '../../utils/salaryHistory/columns';

export const useGetSalaryHistoryDetail = (month: number, year: number, page: number = 1) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [rows, setRows] = useState<DetailRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState(0);
    const [summary, setSummary] = useState<SalaryHistoryDetailSummary | null>(null);

    const fetchDetail = useCallback(async () => {
        if (!month || !year) return;
        setIsLoading(true);
        const res = await getSalaryHistoryDetail({ userType: role, userId: id, month, year, page });
        if (res) {
            const mapped: DetailRecord[] = res.rows.map((item, index) => ({
                key: String(index + 1),
                empId: item.empId,
                name: item.name,
                email: item.email,
                accountPrimary: item.accountDetail,
                accountLabel: '',
                transType: (item.transType === 'N/A' ? 'NEFT' : item.transType) as DetailRecord['transType'],
                grossSalary: item.grossSalary,
                deduction: item.deduction,
                netSalary: item.netPayable,
                status: item.paymentStatus === 'PAID' ? 'Paid' : 'Pending',
                oneTimePayments: item.oneTimePayments ?? [],
            }));
            setRows(mapped);
            setCount(res.count);
            setSummary(res.summary);
        } else {
            setRows([]);
            setCount(0);
            setSummary(null);
        }
        setIsLoading(false);
    }, [role, id, month, year, page]);

    useEffect(() => {
        fetchDetail();
    }, [fetchDetail]);

    return { rows, isLoading, count, summary, refetch: fetchDetail };
};
