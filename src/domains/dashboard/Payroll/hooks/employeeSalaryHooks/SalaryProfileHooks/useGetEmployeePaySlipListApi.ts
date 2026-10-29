import { useState, useCallback, useEffect } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { employeePayrollSlipListing } from '../../../api/employeeSalaryApi/SalaryProfileApi/index';
import {
    payrollTableType,
    payrollSlipListingResponse,
} from '../../../types/salaryProfileTypes/ProfileTypes/index';

export const useGetEmployeePayrollSlipApi = (
    eId: string | undefined,
    page: number,
    limit: number,
    year: number
) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [employeeRows, setEmployeeRows] = useState<payrollTableType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>();
    const [emailCount, setEmailCount] = useState<number>();
    const getEmployeeSalarySlipList = useCallback(async () => {
        setIsLoading(true);
        const data: payrollSlipListingResponse | false = await employeePayrollSlipListing({
            userId: id,
            userType: role,
            eId,
            limit,
            page,
            year,
        });
        if (data) {
            const monthNames = [
                'January',
                'February',
                'March',
                'April',
                'May',
                'June',
                'July',
                'August',
                'September',
                'October',
                'November',
                'December',
            ];
            const arr = data?.rows?.map(item => {
                const monthName = monthNames[item.month - 1] || '';
                return {
                    payrun: `${item?.year || ''} ${monthName}`,
                    payrunMode: 'NA',
                    status: item.paymentStatus ?? '',
                    totalPaid: item.totalPayable,
                    action: '',
                    slipId: item.id,
                };
            });
            setCount(data.count);
            setEmailCount(data.totalEmailed);
            setEmployeeRows(arr);
        }
        setIsLoading(false);
    }, [id, role, eId, limit, page, year]);
    useEffect(() => {
        getEmployeeSalarySlipList();
    }, [getEmployeeSalarySlipList]);
    return { tableDatas: employeeRows, orderCount: count, tableLoading: isLoading, emailCount };
};
