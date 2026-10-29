import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

// import { employeeResponse, employeeTypes } from '../../Payroll/types/docAndAssetsTypes';
import { getEmployees } from '../api/index';

export function useGetEmployee() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [employees, setEmployees] = useState<any[]>([]);
    const employeeList = useCallback(async () => {
        const data: any | false = await getEmployees({
            userId: id,
            userType: role,
        });
        if (data) {
            const details = data.employees as any[];
            setEmployees(details);
        }
    }, [role, id]);

    useEffect(() => {
        employeeList();
    }, [employeeList]);

    const generateEmployeesDropdown = (data: any[]) =>
        data.map(employee => {
            const passportDocument = employee.employeeDocuments.find(
                (doc: any) => doc.name.toLowerCase() === 'passport'
            );
            const emId = employee?.employeeInformation?.employeeId
                ? `(ID ${employee?.employeeInformation?.employeeId})`
                : '';
            return {
                value: employee.value ?? '',
                label: employee.label ? `${employee.label} ${emId}` : '',
                fullName: employee.fullName ?? '',
                dateOfBirth: employee.dateOfBirth ?? '',
                gender: employee.gender ?? '',
                mobileNo: employee.mobileNo ?? '',
                personalEmail: employee.personalEmail ?? '',
                passportExpiryDate: passportDocument ? passportDocument.expiryDate : '',
            };
        });

    return { data: employees, generateEmployeesDropdown };
}
