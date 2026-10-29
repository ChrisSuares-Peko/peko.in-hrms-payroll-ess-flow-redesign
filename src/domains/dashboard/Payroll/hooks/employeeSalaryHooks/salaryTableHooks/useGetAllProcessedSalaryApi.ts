import { useState, useCallback, useEffect } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { employeeSalaryListing } from '../../../api/employeeSalaryApi/employeeSalary';
import {
    employeeSalaryListingResponse,
    salarytableType,
} from '../../../types/salaryProfileTypes/employeeSalaryTable';

export const useGetEmployeeSalaryApi = (
    searchText: string,
    sort: string,
    page: number,
    limit: number,
    filter: string,
    year: number | string,
    month: number | string,
    reloadTable: boolean
) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [employeeRows, setEmployeeRows] = useState<salarytableType[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>();
    const [salaryCycle, setSalaryCycle] = useState<any>(null);
    const getEmployeeSalaryList = useCallback(async () => {
        setIsLoading(true);
        const data: employeeSalaryListingResponse | false = await employeeSalaryListing({
            userId: id,
            userType: role,
            year,
            month,
            searchText,
            sort,
            page,
            limit,
            filter,
        });
        if (data) {
            const arr = data?.rows?.map(item => ({
                id: item.id,
                name: item.employee.personalInformation?.fullName ?? '',
                employeeId: item.employee.employeeInformation.employeeId ?? '',
                role: item.employee.employeeInformation.designation ?? '',
                basicSalary: item?.salaryInformation?.basicPay ?? 0,
                monthlySalary: Number(item.monthlySalary) ?? 0,
                others: parseFloat(item.others.toFixed(2)),
                totalSalary: `AED ${item?.totalPayable || 0}`,
                totalDeduction:
                    parseFloat((item.totalOtherDeduction + item.leaveDeduction).toFixed(2)) ?? 0,
                status: item.paymentStatus,
                action: '',
                email: item.employee.personalInformation?.email ?? '',
                image: item.employee.profileImage,
                department: item?.department?.departmentName || "N/A",
                salaryId: item.id,
                eId: item.employee.id,
            }));

            setCount(data.count);
            setEmployeeRows(arr);
            setIsLoading(false);
            setSalaryCycle(data.salaryCycle ?? null);
        } else {
            setEmployeeRows([]);
            setCount(0);
            setIsLoading(false);
            setSalaryCycle(null);
        }
    }, [id, role, year, month, searchText, sort, page, filter, limit]);

    useEffect(() => {
        getEmployeeSalaryList();
    }, [getEmployeeSalaryList, reloadTable]);

    return { tableDatas: employeeRows, orderCount: count, tableLoading: isLoading, salaryCycle };
};
