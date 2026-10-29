import { useState, useCallback, useEffect } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { incentiveDetails } from '../../../api/employeeSalaryApi/incentiveApi';
import {
    incentiveListingResponse,
    incentiveTable,
} from '../../../types/salaryProfileTypes/incentiveTypes';

export const useGetEmployeeIncentiveApi = (
    eId: string | undefined,
    page: number,
    limit: number,
    year: number,
    month: number | string,
    reloadTable: boolean
) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [incentiveData, setIncentiveData] = useState<incentiveTable[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>();

    const getOverTimeData = useCallback(async () => {
        setIsLoading(true);
        const data: incentiveListingResponse | false = await incentiveDetails({
            userId: id,
            userType: role,
            eId,
            limit,
            page,
            year,
            month,
        });
        if (data) {
            const arr = data.incentivesData?.map(item => ({
                dateAdded: new Date(item.createdAt).toISOString().split('T')[0] ?? '',
                effectiveMonth: item.incentiveDate ?? '',
                incentiveAmount: item.amount ?? 0,
                details: item.details ?? '',
                action: '',
                id: item.id,
            }));
            setCount(data.totalCount);
            setIncentiveData(arr);
        }
        setIsLoading(false);
    }, [id, role, eId, limit, page, year, month]);

    useEffect(() => {
        getOverTimeData();
    }, [getOverTimeData, reloadTable]);

    return { tableDatas: incentiveData, orderCount: count, tableLoading: isLoading };
};
