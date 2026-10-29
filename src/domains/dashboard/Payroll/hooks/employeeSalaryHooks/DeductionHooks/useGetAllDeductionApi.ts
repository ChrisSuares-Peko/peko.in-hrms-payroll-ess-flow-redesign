import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getDeduction } from '../../../api/employeeSalaryApi/deductionApi/index';
import {
    deductionTableType,
    getDeductionResponse,
} from '../../../types/salaryProfileTypes/deductionTypes/index';

export function useGetAllDeduction(
    eId: string | undefined,
    page: number,
    limit: number,
    year: number,
    month: number | string,
    reloadTable: boolean
) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [deduction, setDeductions] = useState<deductionTableType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>();
    const allDeductions = useCallback(async () => {
        setIsLoading(true);
        const data: getDeductionResponse | false = await getDeduction({
            userId: id,
            userType: role,
            eId,
            limit,
            page,
            year,
            month,
        });
        if (data) {
            const arr = data?.deductions?.map(item => ({
                deductionDate: new Date(item.deductionDate).toISOString().split('T')[0] ?? '',
                deductionType: item.deductionType ?? '',
                deductionAmount: item.deductionAmount ?? '',
                deductionStatus: item.deductionStatus ?? '',
                employeeName: '',
                employeeId: item.employee,
                id: item.id,
                description: item?.description || '',
                deductionFor: item?.deductionFor,
                note: item?.note || '',
            }));
            setCount(data.totalCount);
            setDeductions(arr);
        }
        setIsLoading(false);
    }, [id, role, eId, limit, page, year, month]);

    useEffect(() => {
        allDeductions();
    }, [allDeductions, reloadTable]);

    return { data: deduction, count, tableLoading: isLoading };
}
