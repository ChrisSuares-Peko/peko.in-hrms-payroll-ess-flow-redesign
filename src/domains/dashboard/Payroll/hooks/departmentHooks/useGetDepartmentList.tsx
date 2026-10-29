import { useCallback, useEffect, useState } from 'react';

import moment from 'moment';

import { useAppSelector } from '@src/hooks/store';

import { listDepartmentAPI } from '../../api/departmentApi';
import {
    departmentListing,
    departmentTableData,
} from '../../types/departmentTypes/departmentTypes';

export function useGetDepartmentList(searchKey: string | null, page: number, limit: number) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [refresh, setRefresh] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(false);
    const [tableData, setTableData] = useState<departmentTableData[]>([]);
    const [count, setCount] = useState<number>(0);
    const [departmentCount, setDepartmentCount] = useState<number>(0);

    const getDepartment = useCallback(async () => {
        setIsLoading(true);

        const response: departmentListing | false = await listDepartmentAPI({
            userId: id,
            userType: role,
            postData: {
                searchKey,
                page,
                limit,
            },
        });

        if (response) {
            const resData: departmentListing = response as departmentListing;

            setCount(resData.totalCount);
            const data: departmentTableData[] = resData.departmentData.map((item, index) => ({
                key: index,
                date: moment(item.createdAt).format('DD-MM-YYYY'),
                name: item.departmentName,
                code: item.departmentCode,
                description: item.description,
                id: item.id,
            })) as departmentTableData[];

            setTableData(data);
            setDepartmentCount(resData.departmentData.length); // Setting department count
        }
        setRefresh(false);
        setIsLoading(false);
    }, [id, limit, page, role, searchKey]);

    useEffect(() => {
        getDepartment();
    }, [getDepartment, refresh]);
    const refetch = async () => {
        await getDepartment();
    };
    return { tableData, count, isLoading, refetch, setRefresh, departmentCount };
}
