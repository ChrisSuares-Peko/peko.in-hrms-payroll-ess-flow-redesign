import { useState, useCallback, useEffect } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { incrementDetails } from '../../../api/employeeSalaryApi/incrementApi/index';
import {
    incrementTable,
    incrementListingResponse,
} from '../../../types/salaryProfileTypes/incrementTypes/index';

export const useGetEmployeeIncrementApi = (
    eId: string | undefined,
    page: number,
    limit: number,
    year: number,
    month: number | string,
    reloadTable: boolean
) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [incrementData, setIncrementData] = useState<incrementTable[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>();
    const getIncrementData = useCallback(async () => {
        setIsLoading(true);
        const data: incrementListingResponse | false = await incrementDetails({
            userId: id,
            userType: role,
            eId,
            limit,
            page,
            year,
            month,
        });

        if (data) {
            const arr = data?.incrementData?.map(item => ({
                dateAdded: new Date(item.createdAt).toISOString().split('T')[0] ?? '',
                previousBasicSalary: item.basicSalary,
                incrementAmount: item.amount,
                incrementPercentage: item.amount,
                newBasicSalary: item.newBasicSalary,
                effectiveDate: new Date(item.effectiveDate).toISOString().split('T')[0] ?? '',
                percentage: item.amount,
                status: item.status,
                document: item.attachment ? 'Available' : 'NA',
                action: '',
                id: item.id,
                url: item.attachment,
                employeeId: item.employee,
                incrementType: item.incrementType,
            }));
            setCount(data.totalCount);
            setIncrementData(arr);
        }
        setIsLoading(false);
    }, [id, role, eId, limit, page, year, month]);
    useEffect(() => {
        getIncrementData();
    }, [getIncrementData, reloadTable]);

    return { tableDatas: incrementData, orderCount: count, tableLoading: isLoading };
};
