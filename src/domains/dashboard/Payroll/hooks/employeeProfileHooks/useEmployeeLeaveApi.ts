import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getEmployeeLeavePolicies } from '../../api/employeeProfileApi';

export function useEmployeeLeaveApi(
    page: number,
    limit: number,
    searchText: string,
    employeeId: string,
    reloadTable: boolean
) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [leaveComp, setLeaveComp] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [count, setCount] = useState<number>();

    const allLeaveComponents = useCallback(async () => {
        setIsLoading(true);
        const response = await getEmployeeLeavePolicies({
            userId: id,
            userType: role,
            limit,
            page,
            searchText,
            employeeId,
        });
        if (response) {
            const { data } = response;
            const arr = data?.leavePolicyData?.map((item: any) => ({
                leaveType: item?.leaveType ?? '',
                accrualType: item?.accrualType ?? '',
                accrualRate: item?.accrualRate ?? '',
                maximumAccrual: item?.maximumAccrual ?? '',
                leaveBalanceCarryover: item?.leaveBalanceCarryover ?? '',
                maximumNumberOfLeaves: item?.maximumNumberOfLeaves ?? '',
                id: item?.id,
                isGlobal: item?.isGlobal,
                action: '',
            }));
            setCount(data?.totalCount);
            setLeaveComp(arr);
        }
        setIsLoading(false);
    }, [id, role, limit, page, searchText, employeeId]);

    useEffect(() => {
        allLeaveComponents();
    }, [allLeaveComponents, reloadTable]);

    return { data: leaveComp, count, tableLoading: isLoading };
}
