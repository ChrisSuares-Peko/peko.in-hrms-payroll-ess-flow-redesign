import { useCallback, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getApproveSalaryDetails } from '../../../api/employeeSalaryApi/SalaryProfileApi';

export const useGetEmployeeSalaryApi = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<any | null>(null);

    const getProcessSalaryList = useCallback(
        async (month: any, year: any) => {
            setIsLoading(true);
            const response = await getApproveSalaryDetails({
                userId: id,
                userType: role,
                month,
                year,
            });

            if (response) {
                setData(response);
                setIsLoading(false);
            } else {
                setIsLoading(false);
            }
        },
        [id, role]
    );

    return { data, isLoading, getProcessSalaryList };
};
