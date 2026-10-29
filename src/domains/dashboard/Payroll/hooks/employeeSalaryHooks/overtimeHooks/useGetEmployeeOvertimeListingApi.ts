import { useState, useCallback, useEffect } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { overTimeDetails } from '../../../api/employeeSalaryApi/overtimeApi';
import {
    overtimeListingResponse,
    overtimeTable,
} from '../../../types/salaryProfileTypes/overtimeTypes';

export const useGetEmployeeOvertimeApi = (
    eId: string | undefined,
    page: number,
    limit: number,
    year: number,
    month: number | string,
    reloadTable: boolean
) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [overtimeData, setOvertimeData] = useState<overtimeTable[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>();

    const getOverTimeData = useCallback(async () => {
        setIsLoading(true);
        const data: overtimeListingResponse | false = await overTimeDetails({
            userId: id,
            userType: role,
            eId,
            limit,
            page,
            year,
            month,
        });
        if (data) {
            const arr = data?.overTimeData?.map(item => ({
                dateAdded: new Date(item.createdAt).toISOString().split('T')[0] ?? '',
                salaryMonth: item.overTimeDate ?? '',
                totalWorkingHours: item.totalWorkingHours,
                extraHours: item.extraHours ?? 0,
                hourlyRate: item.hourlyRate ?? 0,
                overTimeAmount: item.overTimeAmount ?? 0,
                overTimeRate: item.overTimeRate ?? 0,
                status: item.paymentStatus ?? '',
                action: '',
                id: item.id,
                effectiveDate: new Date(item.overTimeDate).toISOString().split('T')[0] ?? '',
            }));
            setCount(data.totalCount);
            setOvertimeData(arr);
        }
        setIsLoading(false);
    }, [id, role, eId, limit, page, year, month]);

    useEffect(() => {
        getOverTimeData();
    }, [getOverTimeData, reloadTable]);

    return { tableDatas: overtimeData, orderCount: count, tableLoading: isLoading };
};
