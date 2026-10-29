import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { listAllDepartmentAPI } from '../../api/departmentApi';
import { departmentListing, departmentSelect } from '../../types/departmentTypes/departmentTypes';

export function useGetDepartmentList() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [refresh, setRefresh] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(false);
    const [tableData, setTableData] = useState<departmentSelect[]>([]);
    const [departmentCount, setDepartmentCount] = useState<number>(0);

    const getDepartment = useCallback(async () => {
        setIsLoading(true);

        const response: departmentListing | false = await listAllDepartmentAPI({
            userId: id,
            userType: role,
        });

        if (response) {
            const resData: departmentListing = response as departmentListing;
            setIsLoading(false);
            const data: departmentSelect[] = resData.departmentData.map((item, index) => ({
                key: index,
                value: item.id,
                label: item.departmentName,
            })) as departmentSelect[];
            setTableData(data);
            setDepartmentCount(resData.departmentData.length); // Setting department count
        } else {
            setRefresh(false);

            setIsLoading(false);
            setDepartmentCount(0); // Resetting department count
        }
    }, [id, role]);

    useEffect(() => {
        getDepartment();
    }, [getDepartment]);

    const refetch = async () => {
        await getDepartment();
    };

    return { tableData, isLoading, refetch, departmentCount, setRefresh }; // Returning department count
}
