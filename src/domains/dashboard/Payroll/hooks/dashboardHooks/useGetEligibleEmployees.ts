import { useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getEligibleEmployees } from '../../api/employeeSalaryApi/salaryRolloutApi';
import { EligibleEmployee } from '../../types/salaryProfileTypes/salaryRolloutTypes';

export function useGetEligibleEmployees() {
    const { corporateId } = useAppSelector(state => state.reducer.auth);
    const [employees, setEmployees] = useState<EligibleEmployee[]>([]);

    useEffect(() => {
        getEligibleEmployees(corporateId).then(data => {
            if (data) setEmployees(data.rows);
        });
    }, [corporateId]);

    const employeeOptions = employees.map(emp => ({
        value: emp.id,
        label: emp.fullName ?? '',
    }));

    return { employeeOptions };
}
