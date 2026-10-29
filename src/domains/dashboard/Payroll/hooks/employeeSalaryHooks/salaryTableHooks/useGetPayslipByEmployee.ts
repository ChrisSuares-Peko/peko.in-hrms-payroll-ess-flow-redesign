import { useState, useCallback, useEffect } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getPayrollHistoryByEmployeeId } from '../../../api/employeeSalaryApi/employeeSalary';
import { PayslipTableRow } from '../../../types/salaryProfileTypes/employeeSalaryTable';

export const useGetPayslipByEmployee = (
    employeeId?: string,
    year: number = new Date().getFullYear(),
    page: number = 1,
    limit: number = 10
) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [tableDatas, setTableDatas] = useState<PayslipTableRow[]>([]);
    const [orderCount, setOrderCount] = useState<number>(0);
    const [emailCount, setEmailCount] = useState<number>(0);
    const [tableLoading, setTableLoading] = useState<boolean>(true);

    const getPayslipList = useCallback(async () => {
        if (!employeeId) {
            setTableDatas([]);
            setOrderCount(0);
            setEmailCount(0);
            setTableLoading(false);
            return;
        }

        setTableLoading(true);
        const response = await getPayrollHistoryByEmployeeId({
            id: employeeId,
            year,
            limit,
            page,
            userType: role,
            userId: id,
        })

        if (response) {
            const rows = response.rows.map(item => ({
                // A scaffolded month with no Salary doc yet has no id — fall back to a
                // year-month key so it stays unique instead of colliding with every other
                // not-yet-processed month (see allPayrollSlips, controller/salary.js).
                key: item.id || `${item.year}-${item.month}`,
                monthNum: item.month,
                yearNum: item.year,
                paymentStatus: item.paymentStatus || 'N/A',
                payingDate: item.payingDate || null,
                grossEarnings: Number(item.grossEarnings ?? 0),
                totalDeductions: Number(item.totalDeductions ?? 0),
                netPaid: Number(item.netPaid ?? item.totalPayable ?? 0),
                arrearsAmount: Number(item.arrearsAmount ?? 0),
            }));
            setTableDatas(rows);
            setOrderCount(response.count || 0);
            setEmailCount(response.totalEmailed || 0);
        } else {
            setTableDatas([]);
            setOrderCount(0);
            setEmailCount(0);
        }
        setTableLoading(false);
    }, [employeeId, id, limit, page, role, year]);

    useEffect(() => {
        getPayslipList();
    }, [getPayslipList]);

    return { tableDatas, orderCount, emailCount, tableLoading, getPayslipList };
};
