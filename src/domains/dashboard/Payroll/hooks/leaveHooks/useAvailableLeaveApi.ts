import { useCallback, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { availableLeaves } from '../../api/leaveApis';
import { availableLeaveResponse, leaves } from '../../types/leaveSection';

export function useAvailableLeaves() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [leaveData, setLeaves] = useState<leaves[]>([]);
    const getLeave = useCallback(
        async (empId: string) => {
            if (empId) {
                const data: availableLeaveResponse | false = await availableLeaves({
                    userId: id,
                    userType: role,
                    id: empId,
                });
                if (data) {
                    console.log("leave plciy dayataa",data)
                    setLeaves(data.availableLeaves);
                }
            }
        },
        [id, role]
    );
    return { leaves: leaveData, getLeave };
}
