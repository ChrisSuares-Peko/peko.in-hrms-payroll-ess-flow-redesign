import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getAllSalaryComponent } from '../../api/organizationSettings/index';
import { AllSalaryComponentListResponse } from '../../types/organizationSettings';

export function useGetAllEmployeeSalaryComp() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const { personalInformation } = useAppSelector(state => state.reducer.employeeSettings);

    const { refreshSalaryComp } = useAppSelector(state => state.reducer.orgSettings);
    const [salaryComp, setSalaryComp] = useState<any[]>([]);
    // const [totalDeduction, setTotalDeduction] = useState<number>(0)
    const [isLoading, setIsLoading] = useState(true);

    const allSalaryComponents = useCallback(async () => {
        setIsLoading(true);

        const data: AllSalaryComponentListResponse | false = await getAllSalaryComponent({
            userId: id,
            userType: role,
            eId: personalInformation.email,
        });

        if (data) {
            
            const arr = data?.componentData?.map(item => ({
                componentName: item?.componentName ?? '',
                category: item.category ?? '',
                calculationType: item.calculationType ?? '',
                calculationBasis: item?.calculationBasis ?? '',
                amountPercentage: item.amountPercentage ?? '',
                calculationBasedOn: item?.calculationBasedOn ?? '',
                status: item.status ?? '',
                isGlobal: item.isGlobal ?? '',
                id: item._id,
                action: '',
                calculatedAmount: item.calculatedAmount ?? 0,
            }));
         
            setSalaryComp(arr);
            // setTotalDeduction(Number(data?.totalDeduction ?? 0));
        }

        setIsLoading(false);
    }, [id, role, personalInformation.email]);

    useEffect(() => {
        allSalaryComponents();
    }, [allSalaryComponents, refreshSalaryComp]);

    return { data: salaryComp, tableLoading: isLoading };
}
