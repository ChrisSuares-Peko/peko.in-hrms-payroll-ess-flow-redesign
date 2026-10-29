import { useCallback, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getDetailsForLeaveProfile } from '../../api/leaveAndAttendanceApi.ts/index';
import {
    LeaveProfileResponse,
    LeaveRow,
    UseLeaveProfileDetailsApi,
} from '../../types/leaveSection/leaveprofiletypes';

export interface LeaveSummaryData {
    id: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    leaveTaken: string;
    leaveBalance: string;
    leaveTypeName:string;
}

export interface EmployeeDetails {
    fullName: string;
    designation: string;
    profileImage: string | null;
}

export function useLeaveProfileDetailsApi( 
    page:number,
    limit: number,
    searchText: string,
    reloadTable: boolean,
    
): UseLeaveProfileDetailsApi {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [leaveData, setLeaveData] = useState<LeaveSummaryData[]>([]);
    const [employeeDetails, setEmployeeDetails] = useState<EmployeeDetails | null>(null);
    const [isLoading,setIsLoading] = useState(false)

    const getLeave = useCallback(
        async (empId: string) => {
            if (empId) {
                setIsLoading(true)
                const data: LeaveProfileResponse | false = await getDetailsForLeaveProfile({
                    userId: id,
                    userType: role,
                    employeeId: empId,
                    page,
                    limit,
                    searchText
                   
                });
                if (data) {
                    console.log('data from hook leave profile details ', data);
                    // Transform leaves
                    const transformedLeaves: LeaveSummaryData[] = data.rows.map(
                        (leave: LeaveRow) => ({
                            id: leave._id,
                            leaveType: leave.typeOfLeave,
                            startDate: leave.start,
                            endDate: leave.end,
                            leaveTaken: `${leave.leaveCount} `,
                            leaveBalance: `${leave.leaveBalance.availableLeave} Days`,
                            leaveTypeName: leave.leaveTypeName,
                        })
                    );
                    setLeaveData(transformedLeaves);

                    // Set employee details
                    setEmployeeDetails(data.employeeDetails);
                }
            }

            setIsLoading(false)
        },
        [id, limit, page, role, searchText]
    );

    return { leaveData, employeeDetails, getLeave, isLoading };
}


