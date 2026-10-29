import { useState, useCallback, useEffect } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { employeeInfoCard } from '../../api/employees';
import { EmployeesinfoResponse } from '../../types/employeeDetails';

export const useGetEmployeeInfoApi = (reloadTable: boolean) => {
    const initialInfoDetails = {
        totalEmployees: 0,
        deviceUsers: 0,
        subscriptionUsers: 0,
        totalSpent: 0,
    };

    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [infoDetails, setInfoDetails] = useState(initialInfoDetails);
    const [isLoading, setIsLoading] = useState(true);

    const getInfoDetails = useCallback(async () => {
        setIsLoading(true);
        const data: EmployeesinfoResponse | false = await employeeInfoCard({
            userId: id,
            userType: role,
        });

        if (data) {
            setInfoDetails({
                totalEmployees: data.totalEmployees,
                deviceUsers: data.assetsUsers,
                subscriptionUsers: data.subscriptionUsers,
                totalSpent: Number(data.totalAmountSpent),
            });
        }

        setIsLoading(false);
    }, [id, role]);

    useEffect(() => {
        getInfoDetails();
    }, [getInfoDetails, reloadTable]);

    return {
        tableLoading: isLoading,
        infoDetails,
    };
};
