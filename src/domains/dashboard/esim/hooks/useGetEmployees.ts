import { useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getEmployees } from '../api/index';

export type EmployeeOption = {
    value: string;
    label: string;
    name: string;
    email: string;
};

export default function useGetEmployees(enabled: boolean) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [employees, setEmployees] = useState<EmployeeOption[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasFetched, setHasFetched] = useState(false);

    useEffect(() => {
        if (!enabled || hasFetched) return;

        const fetchEmployees = async () => {
            setIsLoading(true);
            const data = await getEmployees({ userId: id, userType: role });
            if (data) {
                setEmployees(
                    (data.employees ?? []).map(employee => ({
                        value: employee.id,
                        label: `${employee.personalInformation?.fullName ?? ''} - ${
                            employee.employeeInformation?.employeeId ?? ''
                        }`,
                        name: employee.personalInformation?.fullName ?? '',
                        email: employee.personalInformation?.email ?? '',
                    }))
                );
            }
            setHasFetched(true);
            setIsLoading(false);
        };

        fetchEmployees();
    }, [enabled, hasFetched, id, role]);

    return { employees, isLoading };
}
