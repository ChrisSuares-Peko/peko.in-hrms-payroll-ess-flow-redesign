import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getEmployees } from '../../api/docAndAssetsApi/index';
import { employeeResponse, employeeTypes } from '../../types/docAndAssetsTypes';

export function useGetEmployee() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [employees, setEmployees] = useState<employeeTypes[]>([]);
    const employeeList = useCallback(async () => {
        const data: employeeResponse | false = await getEmployees({
            userId: id,
            userType: role,
        });
        if (data) {
            const details = data.employees as employeeTypes[];
            setEmployees(details);
        }
    }, [role, id]);

    useEffect(() => {
        employeeList();
    }, [employeeList]);

    const generateEmployeesDropdown = (data: employeeTypes[]) =>
        data.map(employee => ({
            value: employee.id,
            label: employee.label,
        }));

    return { data: employees, generateEmployeesDropdown };
}
