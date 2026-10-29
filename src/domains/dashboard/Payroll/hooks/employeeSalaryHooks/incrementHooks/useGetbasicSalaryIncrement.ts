import { useState, useCallback } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { incrementBasicSalary } from '../../../api/employeeSalaryApi/incrementApi/index';

export const useGetBasicSalaryIncrementApi = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const [basicSalary, setBasicSalary] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const getBasicSalarytIncrementData = useCallback(
        async (month: number, year: number, employeeId: string) => {
            setIsLoading(true);
            const data = await incrementBasicSalary({
                userId: id,
                userType: role,
                month,
                year,
                employeeId,
            });

            if (data && data.status && data.data) {
                setBasicSalary(data.data.basicSalary);
            } else {
                setBasicSalary(null);
            }

            setIsLoading(false);
        },
        [id, role]
    );

    return { basicSalary, tableLoading: isLoading, getBasicSalarytIncrementData };
};
