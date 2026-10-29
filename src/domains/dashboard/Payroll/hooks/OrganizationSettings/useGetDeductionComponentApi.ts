import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getDeductionComponent } from '../../api/organizationSettings/index';
import { DeductionComponentListResponse } from '../../types/organizationSettings';

export function useGetAllDeductions(
    page: number,
    limit: number,
    searchText: string,
    reloadTable: boolean,
    // Deduction Components (Settings tab) intentionally hides "Provident Fund (PF)" — it's
    // driven by Compliance Settings > EPF, not configured here. CTC-preview consumers
    // (Dashboard Calculator, Add Employee, New Hire) reuse this same hook to seed their
    // starting structure and pass `true` so PF isn't invisible in the preview, even though
    // it's still calculated correctly for real employees regardless of this flag.
    includePf = false
) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [deductionComp, setDeductionComp] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>();


    const allDeductionComponents = useCallback(async () => {
        setIsLoading(true);
        const data: DeductionComponentListResponse | false = await getDeductionComponent({
            userId: id,
            userType: role,
            limit,
            page,
            searchText,
            includePf,
        });
        if (data) {
            const arr = data?.componentData?.map(item => ({
                deductionName: item?.deductionName ?? '',
                deductionType: item.deductionType ?? '',
                calculationType: item.calculationType ?? '',
                amountPercentage: item.amountPercentage ?? '',
                calculationBasis: item?.calculationBasis ?? '',
                salaryDeductionType: item?.salaryDeductionType ?? '',
                status: item.status ?? '',
                id: item.id,
                action: '',
            }));
            setCount(data.totalCount);
            setDeductionComp(arr);
        }
        setIsLoading(false);
    }, [id, role, limit, page, searchText, includePf]);

    useEffect(() => {
        allDeductionComponents();
    }, [allDeductionComponents, reloadTable]);

    return { data: deductionComp, count, tableLoading: isLoading };
}
