import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getLeaveComponent } from '../../api/leaveSettings';
import { LeaveComponentListResponse } from '../../types/organizationSettings';

export function useGetAllLeaves(
    page: number,
    limit: number,
    searchText: string,
    reloadTable: boolean
) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [leaveComp, setLeaveComp] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>();

    const allLeaveComponents = useCallback(async () => {
        setIsLoading(true);
        const data: LeaveComponentListResponse | false = await getLeaveComponent({
            userId: id,
            userType: role,
            limit,
            page,
            searchText,
        });
        if (data) {
            const arr = data?.leaveComponentData?.map(item => ({
                leaveType: item?.leaveType ?? '',
                accrualType: item?.accrualType ?? '',
                accrualRate: item?.accrualRate ?? '',
                maximumAccrual: item?.maximumAccrual ?? '',
                leaveBalanceCarryover: item?.leaveBalanceCarryover ?? '',
                maximumNumberOfLeaves: item?.maximumNumberOfLeaves ?? '',
                applicableGender: item?.applicableGender ?? 'ALL',
                id: item?.id,
                action: '',
            }));
            setCount(data.totalCount);
            setLeaveComp(arr);
        }
        setIsLoading(false);
    }, [id, role, limit, page, searchText]);

    useEffect(() => {
        allLeaveComponents();
    }, [allLeaveComponents, reloadTable]);

    return { data: leaveComp, count, tableLoading: isLoading };
}
