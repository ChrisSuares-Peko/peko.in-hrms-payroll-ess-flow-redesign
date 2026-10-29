import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getSalaryComponent } from '../../api/organizationSettings/index';
import { SalaryComponentListResponse } from '../../types/organizationSettings';

export function useGetAllSalaryComp(
    page: number,
    limit: number,
    searchText: string,
    reloadTable: boolean
) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [salaryComp, setSalaryComp] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>();

    const allSalaryComponents = useCallback(async () => {
        setIsLoading(true);

        const data: SalaryComponentListResponse | false = await getSalaryComponent({
            userId: id,
            userType: role,
            limit,
            page,
            searchText,
        });

        if (data) {
            const arr = data?.componentData?.map(item => ({
                componentName: item?.componentName ?? '',
                category: item.category ?? '',
                calculationType: item.calculationType ?? '',
                calculationBasis: item.calculationBasis ?? '',
                calculationBasedOn: item.calculationBasedOn ?? '',
                amountPercentage: item.amountPercentage ?? '',
                calculationFrequency: item?.calculationFrequency ?? '',
                status: item.status ?? '',
                id: item.id,
                action: '',
            }));

            setCount(data.totalCount);
            setSalaryComp(arr);
        }

        setIsLoading(false);
    }, [id, role, limit, page, searchText]);

    useEffect(() => {
        allSalaryComponents();
    }, [allSalaryComponents, reloadTable]);

    return { data: salaryComp, count, tableLoading: isLoading };
}
