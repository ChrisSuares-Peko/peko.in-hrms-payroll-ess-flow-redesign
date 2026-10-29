import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { employeeResponse, employeeTypes } from '../../Payroll/types/docAndAssetsTypes';
import { getEmployees } from '../api/basicInfo';

export function useGetEmployee() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [employees, setEmployees] = useState<employeeTypes[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchEmployees = useCallback(async () => {
        setIsLoading(true);
        const data: employeeResponse | false = await getEmployees({
            userId: id,
            userType: role,
        });
        if (data) {
            setEmployees(data.employees as employeeTypes[]);
        }
        setIsLoading(false);
    }, [role, id]);

    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    const generateEmployeesDropdown = (data: employeeTypes[]) =>
        data.map(employee => {
            const emId = employee?.employeeInformation?.employeeId
                ? `(ID ${employee?.employeeInformation?.employeeId})`
                : '';
            const pi = (employee as any).personalInformation ?? {};
            return {
                value: employee.value ?? '',
                label: employee.label ? `${employee.label} ${emId}` : '',
                fullName: pi.fullName ?? employee.fullName ?? '',
                dateOfBirth: pi.dateOfBirth ?? employee.dateOfBirth ?? '',
                gender: pi.gender ?? employee.gender ?? '',
                mobileNo: pi.mobileNo ?? employee.mobileNo ?? '',
                email: pi.email ?? '',
                addressLine1: pi.addressLine1 ?? '',
                addressLine2: pi.addressLine2 ?? '',
                city: pi.state ?? '',
                nationality: pi.country ?? employee.nationality ?? '',
                passportNo: pi.passportNo ?? employee.passportNo ?? '',
                passportIssuedCountry: pi.passportIssuedCountry ?? employee.passportIssuedCountry ?? '',
                passportExpiryDate: pi.passportExpiryDate ?? employee.passportExpiryDate ?? '',
            };
        });

    return { data: employees, generateEmployeesDropdown, isLoading };
}
