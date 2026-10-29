import { useState, useCallback, useEffect } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { employeeLeaveDetails } from '../../api/leaveApis';
import { leaveListingResponse, LeaveTableRow } from '../../types/leaveSection';


export const useGetEmployeeLeaveApi = (
    eId: string | undefined,
    page: number,
    limit: number,
    year: number,
    month: number | string,
    reloadTable: boolean
) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [employeeLeaveRows, setEmployeeLeaveRows] = useState<LeaveTableRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>();

    const getEmployeeLeaveList = useCallback(async () => {
        setIsLoading(true);
        const data: leaveListingResponse | false = await employeeLeaveDetails({
            userId: id,
            userType: role,
            eId,
            limit,
            page,
            year,
            month,
        });
        if (data) {
            const arr = data?.rows?.map(item => ({
                leaveType: {
                    _id: item.leaveType?._id ?? '',
                    typeOfLeave: item.leaveType?.typeOfLeave ?? '',
                },
                from: new Date(item.start).toISOString().split('T')[0] ?? '',
                to: new Date(item.end).toISOString().split('T')[0] ?? '',
                totalDays: item.leaveCount,
                leaveBalance: item.leaveBalance,
                action: '',
                id: item.id,
                employeeName: '',
                employeeId: item.employee,
                halfDaySelection: item?.halfDaySelection || "",
            }));
            setCount(data.count);
            setEmployeeLeaveRows(arr);
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [id, role, eId, limit, page, year, month]);

    useEffect(() => {
        getEmployeeLeaveList();
    }, [getEmployeeLeaveList, reloadTable]);

    return { tableDatas: employeeLeaveRows, orderCount: count, tableLoading: isLoading };
};
