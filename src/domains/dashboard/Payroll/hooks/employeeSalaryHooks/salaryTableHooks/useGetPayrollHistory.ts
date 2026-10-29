import { useState, useCallback, useEffect } from 'react';

import { formatDate } from '@src/domains/admin/paymentLinks/utils/helpers';
import { useAppSelector } from '@src/hooks/store';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { getPayrollHistory } from '../../../api/employeeSalaryApi/employeeSalary';
import { PayrollHistoryResponse, PayrollHistoryTableRow } from '../../../types/salaryProfileTypes/employeeSalaryTable';
import { monthNames } from '../../../utils/salaryTable/data';


export const useGetPayrollHistory = (year: number) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [tableDatas, setTableDatas] = useState<PayrollHistoryTableRow[]>([]);
    const [tableLoading, setTableLoading] = useState<boolean>(true);

    const getPayrollHistoryList = useCallback(async () => {
        setTableLoading(true);
        const response = (await getPayrollHistory({
            userId: id,
            userType: role,
            year,
        })) as PayrollHistoryResponse;

        if (response?.salaryRows) {
            const rows = response.salaryRows.map((item, index) => ({
                id: `${item.year}-${item.month}-${index}`,
                createdDate: formatDate(item.createdDate),
                month: `${monthNames[item.month - 1] || ''} ${item.year}`,
                monthNumber: item.month,
                year: item.year,
                processedOn: formatDate(item.processedOn || ''),
                totalEmployees: item.totalEmployees || 0,
                totalAmount: `₹ ${formatNumberWithLocalString(item.totalAmount || 0)}`,
                status: item.salaryStatus || 'N/A',
            }));
            setTableDatas(rows);
        } else {
            setTableDatas([]);
        }
        setTableLoading(false);
    }, [id, role, year]);

    useEffect(() => {
        getPayrollHistoryList();
    }, [getPayrollHistoryList]);

    return { tableDatas, tableLoading, getPayrollHistoryList };
};
