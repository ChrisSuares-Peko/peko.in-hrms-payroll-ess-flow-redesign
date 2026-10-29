import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getEmployeeListAPI } from '../../api/announcementApi';
import { IEmployeeList } from '../../types/announcementTypes';

export default function GetEmployeeList() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [employeesData, setEmployeesData] = useState<any>();
    const [isLoading, setIsLoading] = useState(true);

    const getEmployeeListHandler = useCallback(async () => {
        const data: IEmployeeList | false = await getEmployeeListAPI({
            userId: id,
            userType: role,
        });
        if (data) {
            const res = data;
            const arr = res.employees.map((item, index) => ({
                key: index + 1,
                label: item.personalInformation.fullName,
                value: item.id,
            }));

            setEmployeesData(arr);
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [id, role]);

    useEffect(() => {
        getEmployeeListHandler();
    }, [getEmployeeListHandler]);

    return { employeesData, isLoading };
}
