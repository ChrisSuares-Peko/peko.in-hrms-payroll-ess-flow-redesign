import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getDeduction } from '../../api/employeeProfileApi';

export function useGetAllDeduction(
    eId: string | undefined,
    page: number,
    limit: number,
    year: number,
    month: number | string,
    reloadTable: boolean
) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [deduction, setDeductions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>();
    const [amount, setAmount] = useState<number>();
    const allDeductions = useCallback(async () => {
        if (!eId) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        const response = await getDeduction({
            userId: id,
            userType: role,
            eId,
            limit,
            page,
            year,
            month,
        });
        if (response) {
            const { data, totalCount, totalDeductions } = response;

            const arr = data?.map((item: any) => ({
                deductionName: item.deductionName ?? '',
                deductionType: item.deductionType ?? '',
                calculationType: item.calculationType ?? '',
                amountPercentage: item.amountPercentage ?? '',
                calculationBasis: item.calculationBasis ?? '',
                isGlobal: item.isGlobal ?? '',
                status: item.status ?? '',
                id: item.id ?? '',
                salaryDeductionType:item.salaryDeductionType ?? ''
            }));
            setCount(totalCount);
            setDeductions(arr);
            setAmount(totalDeductions);
        }
        setIsLoading(false);
    }, [id, role, eId, limit, page, year, month]);

    useEffect(() => {
        allDeductions();
    }, [allDeductions, reloadTable]);

    return { data: deduction, count, tableLoading: isLoading, amount };
}
