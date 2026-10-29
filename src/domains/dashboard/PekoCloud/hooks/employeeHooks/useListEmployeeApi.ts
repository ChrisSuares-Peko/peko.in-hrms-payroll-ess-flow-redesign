import { useState, useCallback, useEffect } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { employeeList } from '../../api/employees';
import { EmployeeListingResponse } from '../../types/employeeDetails/index';

export const useGetAllEmployeeApi = (
    page: number,
    limit: number,
    reloadTable: boolean,
    searchText: string
) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [employeeListData, setEmployeeListData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>();

    const getEmployeeList = useCallback(async () => {
        setIsLoading(true);
        const data: EmployeeListingResponse | false = await employeeList({
            userId: id,
            userType: role,
            limit,
            page,
            searchText,
        });

        if (data) {
            const arr = data.result.map(item => ({
                employee: item.employeeName ?? '',
                employeeId: item.employeeID ?? '',
                department: item.department ?? '',
                noOfSubscriptions: item?.subscriptions ?? [],
                noOfDevices: item?.assetsAndFleet ?? [],
                joiningDate: item.joiningDate ?? '',
                monthlySpent: item.totalSpent ?? 0,
                actions: '',
                employeeEmail: item.employeeEmail ?? '',
                id: item.id ?? '',
                profilePicture: item.profilePicture ?? '',
            }));
            setCount(data.totalData);
            setEmployeeListData(arr);
        }
        setIsLoading(false);
    }, [id, role, limit, page, searchText]);

    useEffect(() => {
        getEmployeeList();
    }, [getEmployeeList, reloadTable]);

    return {
        tableDatas: employeeListData,
        orderCount: count,
        tableLoading: isLoading,
    };
};
