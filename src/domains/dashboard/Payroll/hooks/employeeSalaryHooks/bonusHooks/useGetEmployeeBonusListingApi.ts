import { useState, useCallback, useEffect } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { bonusDetails } from '../../../api/employeeSalaryApi/bonusApi/index';
import {
    bonusTable,
    bonusListingResponse,
} from '../../../types/salaryProfileTypes/bonustypes/index';

export const useGetEmployeeBonusApi = (
    eId: string | undefined,
    page: number,
    limit: number,
    year: number,
    month: number | string,
    reloadTable: boolean
) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [bonusData, setBonusData] = useState<bonusTable[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>();
    const getBonusData = useCallback(async () => {
        setIsLoading(true);
        const data: bonusListingResponse | false = await bonusDetails({
            userId: id,
            userType: role,
            eId,
            limit,
            page,
            year,
            month,
        });
        if (data) {
            const arr = data?.bonusData?.map(item => ({
                dateAdded: new Date(item.createdAt).toISOString().split('T')[0] ?? '',
                effectiveMonth: item.bonusDate ?? '',
                bonusAmount: item.bonusAmount ?? '',
                action: '',
                id: item.id,
                employeeId: item.employee,
                type: item.type,
            }));
            setCount(data.totalCount);
            setBonusData(arr);
        }
        setIsLoading(false);
    }, [id, role, eId, limit, page, year, month]);
    useEffect(() => {
        getBonusData();
    }, [getBonusData, reloadTable]);

    return { tableDatas: bonusData, orderCount: count, tableLoading: isLoading };
};
