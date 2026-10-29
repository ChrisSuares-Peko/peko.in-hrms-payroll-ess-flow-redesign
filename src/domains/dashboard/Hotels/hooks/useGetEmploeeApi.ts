import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getEmployees } from '../Api';
import { employeeResponse, employeeTypes } from '../types/types';

export function useGetEmployee(isPurchasedPayroll?: boolean) {
    
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [employees, setEmployees] = useState<employeeTypes[]>([]);
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
        data.map(employee => {
            const passportDocument = employee.employeeDocuments.find(
                doc => doc.name.toLowerCase() === 'passport'
            );
            const emId = employee?.employeeInformation?.employeeId
                ? `(ID ${employee?.employeeInformation?.employeeId})`
                : '';
            return {
                value: employee.value ?? '',
                label: employee.label ? `${employee.label} ${emId}` : '',
                fullName: employee.personalInformation.fullName ?? '',
                dateOfBirth: employee.personalInformation.dateOfBirth ?? '',
                gender: employee.personalInformation.gender ?? '',
                mobileNo: employee.personalInformation.mobileNo ?? '',
                personalEmail: employee.personalInformation.email ?? '',
                passportExpiryDate: passportDocument ? passportDocument.expiryDate : '',
            };
        });
    return { data: employees, generateEmployeesDropdown ,isLoading};
}
