import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getEmployees, getPayrollEmployees } from '../../api/employees';
import { GetEmployeesResponse } from '../../types/employeeDetails';

export function useGetEmployee(isPurchasedPayroll?: boolean) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [employees, setEmployees] = useState<any[]>([]);

    const [payrollEmployees, setPayrollEmployees] = useState<any[]>([]);

    // Fetch normal employees
    const employeeDataList = useCallback(async () => {
        const data: GetEmployeesResponse | false = await getEmployees({
            userId: id,
            userType: role,
            searchText: '',
        });
        if (data) {
            const arr = data?.employeesData.map(item => ({
                employee: item.employeeName ?? '',
                employeeId: item.employeeID ?? '',
                department: item.department ?? '',
                employeeEmail: item.employeeEmail ?? '',
                id: item?.id ?? '',
            }));

            setEmployees(arr);
        }
    }, [role, id]);

    // Fetch payroll employees
    const employeeDataListPayroll = useCallback(async () => {
        const data = await getPayrollEmployees({ userType: role, userId: id });

        if (data) {
            const arr = data?.employees.map((item: any) => ({
                employee: item.fullName ?? '',
                employeeId: item.employeeInformation?.employeeId ?? '',
                department: item.employeeInformation?.designation ?? '',
                employeeEmail: item.personalEmail ?? '',
                id: item.id ?? '',
                joiningDate: item.employeeInformation?.dateOfJoin.split('T')[0] ?? '',
            }));

            setPayrollEmployees(arr);
        }
    }, [role, id]);

    // Call the appropriate API based on whether payroll is purchased
    useEffect(() => {
        if (isPurchasedPayroll) {
            employeeDataListPayroll();
        } else {
            employeeDataList();
        }
    }, [isPurchasedPayroll, employeeDataList, employeeDataListPayroll]);

    // Generate dropdown options for employees
    const generateEmployeesDropdown = (data: any[], existEmployee?: any) =>
        data
            .filter(employee => !existEmployee || existEmployee.id !== employee.id)
            .map(employee => ({
                value: employee.id,
                label: `${employee.employee} - ${employee?.employeeId}`,
            }));

    return { data: employees, generateEmployeesDropdown, payrollEmployees };
}
