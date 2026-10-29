import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getEmployeeSalaryComp } from '../../api/employeeProfileApi/index';

export function useGetEmployeeSalaryComp(
    employeeId: string | undefined,
    page: number,
    limit: number,
    reloadTable: boolean
) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const { refreshSalaryComp } = useAppSelector(state => state.reducer.orgSettings);
    const [salaryComp, setSalaryComp] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [count, setCount] = useState<number>();
    const [amount, setAmount] = useState<number>();

    const allSalaryComponents = useCallback(async () => {
        setIsLoading(true);

        const response: any | false = await getEmployeeSalaryComp({
            userId: id,
            userType: role,
            employeeId,
            limit,
            page,
        });

        if (response) {
            const { componentData, totalCount, totalEarnings } = response;
            const arr = componentData?.map((item: any) => ({
                componentName: item?.componentName ?? '',
                calculationType: item.calculationType ?? '',
                amountPercentage: item.amountPercentage ?? '',
                calculationBasedOn: item?.calculationBasedOn ?? '',
                status: item.status ?? '',
                isGlobal: item.isGlobal ?? '',
                id: item.id,
                action: '',
            }));

            setSalaryComp(arr);
            setCount(totalCount);
            setAmount(totalEarnings);
        }
        setIsLoading(false);
    }, [id, role, employeeId, limit, page]);

    useEffect(() => {
        allSalaryComponents();
    }, [allSalaryComponents, refreshSalaryComp, reloadTable]);

    return { data: salaryComp, count, amount, tableLoading: isLoading };
}
