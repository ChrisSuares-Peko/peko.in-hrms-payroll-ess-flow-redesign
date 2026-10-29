import { useState, useCallback, useEffect } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getEmployeeTakenLeave } from '../../api/leaveApis';
import {
    ArrowIcon,
    BalloonIcon,
    CalenderIcon,
    MedicalKitIcon,
} from '../../assets/icons/leaveSummary';
import { GetTakenLeaveResponse, LeaveTakenSummaryData } from '../../types/leaveSection';

export const useGetTakenLeaveApi = (eId: string | undefined, reloadTable: boolean) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [takenLeaveDetails, setTakenLeaveDetails] = useState<LeaveTakenSummaryData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const getEmployeeReimbursementList = useCallback(async () => {
        const data: GetTakenLeaveResponse | false = await getEmployeeTakenLeave({
            userId: id,
            userType: role,
            eId,
        });
        if (data) {
            const { takenLeaves } = data;
            const arr = Object.keys(takenLeaves).map(key => {
                let icon;
                switch (key) {
                    case 'Annual Leave':
                        icon = ArrowIcon;
                        break;
                    case 'Medical Leave':
                        icon = MedicalKitIcon;
                        break;
                    case 'Other Leaves':
                        icon = BalloonIcon;
                        break;
                    case 'Unpaid Leave':
                        icon = CalenderIcon;
                        break;
                    default:
                        icon = '';
                        break;
                }
                return {
                    title: key,
                    value: takenLeaves[key],
                    icon,
                };
            });
            setTakenLeaveDetails(arr);
        }
        setIsLoading(false);
    }, [id, role, eId]);

    useEffect(() => {
        getEmployeeReimbursementList();
    }, [getEmployeeReimbursementList, reloadTable]);

    return { takenLeaveDetails, tableLoading: isLoading };
};
