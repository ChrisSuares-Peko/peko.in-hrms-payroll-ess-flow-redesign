import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getProcessSalaryEmployeesApi } from '../../api/processSalary';
import {
    ProcessSalaryEmployeeRow,
    ProcessSalaryEmployeesResponse,
} from '../../types/processSalary';

export const useGetProcessSalaryEmployeesApi = ({
    month,
    year,
    limit = 10,
    searchText = '',
}: {
    month: number | string;
    year: number | string;
    limit?: number;
    searchText?: string;
}) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [rows, setRows] = useState<ProcessSalaryEmployeeRow[]>([]);
    const [count, setCount] = useState(0);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    const getEmployees = useCallback(async () => {
        setIsLoading(true);
        const data: ProcessSalaryEmployeesResponse | false = await getProcessSalaryEmployeesApi({
            userId: id,
            userType: role,
            month,
            year,
            page,
            limit,
            searchText,
        });

        if (data) {
            setRows(data.rows || []);
            setCount(data.count || 0);
        } else {
            setRows([]);
            setCount(0);
        }

        setIsLoading(false);
    }, [id, role, month, year, page, limit, searchText]);

    useEffect(() => {
        getEmployees();
    }, [getEmployees]);

    return {
        rows,
        count,
        page,
        setPage,
        isLoading,
        refetch: getEmployees,
    };
};
