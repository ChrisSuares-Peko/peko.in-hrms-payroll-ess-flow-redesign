import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { leaveList } from '../../api/leaveApis';
import { leaveData, LeaveTableRow } from '../../types/leaveSection';

export function useListLeave(
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
        const data: leaveData | false = await leaveList({
            userId: id,
            userType: role,
            start,
            length,
            search,
            year,
            month,
        });

        if (data) {
            const arr = data.leaveData?.map(item => ({
                leaveType: {
                    _id: item.leaveType?._id ?? '',
                    typeOfLeave: item.leaveType?.typeOfLeave ?? '',
                },
                from: new Date(item.start).toISOString().split('T')[0] ?? '',
                to: new Date(item.end).toISOString().split('T')[0] ?? '',
                totalDays: item.leaveCount,
                file: item.leaveSupportingDocs ? 'Available' : 'NA',
                leaveSupportingDocs: item.leaveSupportingDocs || '',
                action: '',
                id: item.id,
                employeeName: item.employee?.fullName,
                employeeId: item.employee?.id,
                leaveBalance: item.leaveBalance ?? 0,
                halfDaySelection: item.halfDaySelection ?? '',
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

export function formatLeaveTypeString(input: string) {
    if (input === 'UNPAID') {
        return 'Unpaid';
    }
    const formattedString = input.replace(/([A-Z])/g, ' $1');
    const capitalizedString = formattedString.charAt(0).toUpperCase() + formattedString.slice(1);
    return capitalizedString;
}
