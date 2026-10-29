import { useCallback, useState } from 'react';

import { useDispatch } from 'react-redux';

import { useAppSelector } from '@src/hooks/store';
import { hideLoader, showLoader } from '@src/slices/loaderSlice.js';

import { getAvailableLeavePolicies } from '../../api/leaveAndAttendanceApi.ts/index.js';
import { LeaveResponse, leaves } from '../../types/leaveSection/index.js';

export function useAvailableLeavePoliciesApi(needLoader: boolean = false) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    // const {} = useAppSelector(state => state.reducer.loader);
    const [leaveData, setLeaves] = useState<leaves[]>([]);
    const dispatch = useDispatch()
    const getLeave = useCallback(
        async (empId: string) => {
            if (empId) {
                if(needLoader){
                    dispatch(showLoader())
                }
                const data: LeaveResponse | false = await getAvailableLeavePolicies({
                    userId: id,
                    userType: role,
                    employeeId: empId,
                });
                if (data) {
                    console.log('leave plciy dayataa', data.leavePolicyData);

                    const transformedLeaves: leaves[] = data.leavePolicyData.map(policy => ({
                        value: policy.id, 
                        label: policy.leaveType, 
                        count: policy.maximumNumberOfLeaves, 
                        balance:policy.balanceLeaves
                    }));
                    setLeaves(transformedLeaves);
                }
                if(needLoader){
                    dispatch(hideLoader())
                }
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [id, role]
    );
    return { leaves: leaveData, getLeave };
}
