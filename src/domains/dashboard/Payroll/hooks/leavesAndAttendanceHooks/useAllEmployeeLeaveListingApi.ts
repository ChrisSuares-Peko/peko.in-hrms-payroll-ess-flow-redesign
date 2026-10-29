import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getleaveList } from '../../api/leaveAndAttendanceApi.ts';
import { LeaveTableRow } from '../../types/leaveSection';

export function useAllEmployeeLeaveListingApi(
    start: number,
    length: number,
    search: string,
    year: number,
    month: number,
    reloadTable: boolean = false
) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [leaveTableData, setLeaveTableData] = useState<LeaveTableRow[]>([]);
    const [count, setCount] = useState<number>();

    const employeeLeaves = useCallback(async () => {
        setIsLoading(true);
        const data = await getleaveList({
            userId: id,
            userType: role,
            start,
            length,
            search,
            year,
            month,
        });
        console.log('Data from hook', data);

        if (data) {
            // const arr = data?.leaveData?.map((item:any) => ({
            //     leaveType: item.typeOfLeave ?? '',
            //     from: new Date(item.start).toISOString().split('T')[0] ?? '',
            //     to: new Date(item.end).toISOString().split('T')[0] ?? '',
            //     totalDays: item.leaveCount,

            //     action: '',
            //     id: item.id,
            //     employeeName: item.personalInformation?.fullName,
            //     employeeId: item.employee?.id,
            // }));

            const arr = data?.leaveData?.map((item: any) => ({
                    leaveType: item.typeOfLeave ?? '',
                    from: new Date(item.start).toISOString().split('T')[0] ?? '',
                    to: new Date(item.end).toISOString().split('T')[0] ?? '',
                    totalDays: item.leaveCount,
                    action: '',
                    id: item._id, // ✅ use _id instead of id
                    employeeName: item.employee?.personalInformation?.fullName ?? '-', // ✅ safer access
                    employeeId: item.employee?._id ?? '-',
                    employeeInformation_employeeId:item.employee?.employeeInformation?.employeeId ?? '-',
                    leaveBalance:item.leaveBalance,
                    halfDaySelection:item?.halfDaySelection || " ",
                }));

            setLeaveTableData(arr);
            setCount(data.totalCount);
            setIsLoading(false);
        }
        setIsLoading(false);
    }, [id, role, start, length, search, year, month]);

    useEffect(() => {
        employeeLeaves();
    }, [employeeLeaves, reloadTable]);

    return { isLoading, data: leaveTableData, count, employeeLeaves };
}
