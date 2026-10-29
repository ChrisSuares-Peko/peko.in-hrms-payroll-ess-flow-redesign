import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getEmployees } from '../api';
import { employeeResponse, employeeTypes } from '../types/employee';

export function useGetEmployee(isPurchasedPayroll?: boolean) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [employees, setEmployees] = useState<employeeTypes[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const employeeList = useCallback(async () => {
        if (isPurchasedPayroll) {
            setIsLoading(true);
            const data: employeeResponse | false = await getEmployees({
                userId: id,
                userType: role,
            });
            if (data) {
                const details = data.employees as employeeTypes[];
                setEmployees(details);
            }
            setIsLoading(false);
        }
    }, [role, id, isPurchasedPayroll]);

    useEffect(() => {
        employeeList();
    }, [employeeList]);

    const generateEmployeesDropdown = (data: employeeTypes[]) =>
        data.map(employee => ({
            value: employee.id ?? '',
            label: `${employee.personalInformation.fullName} - ${employee?.employeeInformation?.employeeId}`,
            personalEmail: employee?.personalInformation?.email ?? '',
            fullName: employee.personalInformation.fullName ?? '',
        }));

    return { data: employees, generateEmployeesDropdown, isLoading };
}
