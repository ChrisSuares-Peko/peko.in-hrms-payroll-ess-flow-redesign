import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getSalaryHistoryDetail, SalaryHistoryDetailSummary } from '../../api/salaryHistoryApi/salaryHistoryDetail';
import { PayrollHistoryDetailRecord } from '../../utils/payrollHistory/columns';

const paymentStatusMap: Record<string, PayrollHistoryDetailRecord['status']> = {
    PAID: 'Paid',
    APPROVED: 'Approved',
    UPCOMING: 'Upcoming',
};

const resolveStatus = (raw: string): PayrollHistoryDetailRecord['status'] =>
    paymentStatusMap[raw] ?? 'Pending';

export const useGetPayrollHistoryDetail = (month: number, year: number, page: number = 1) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [rows, setRows] = useState<PayrollHistoryDetailRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState(0);
    const [summary, setSummary] = useState<SalaryHistoryDetailSummary | null>(null);

    const fetchDetail = useCallback(async () => {
        if (!month || !year) return;
        setIsLoading(true);
        const res = await getSalaryHistoryDetail({ userType: role, userId: id, month, year, page });
        if (res) {
            const mapped: PayrollHistoryDetailRecord[] = res.rows.map((item, index) => ({
                key: String(index + 1),
                empId: item.empId,
                name: item.name,
                email: item.email,
                grossSalary: item.grossSalary,
                deduction: item.deduction,
                netSalary: item.netPayable,
                status: resolveStatus(item.paymentStatus),
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
