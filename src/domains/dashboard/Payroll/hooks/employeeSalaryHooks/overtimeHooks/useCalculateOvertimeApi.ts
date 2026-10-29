import { useCallback, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { calculateOvertime } from '../../../api/employeeSalaryApi/overtimeApi';
import { overtimeAmountCalculateResponse } from '../../../types/salaryProfileTypes/overtimeTypes';

export default function GetOvertimeAmount() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(true);

    const getOvertimeDetails = useCallback(
        async (eId: string, extraHours: number, overtimeRate: number) => {
            const data: overtimeAmountCalculateResponse | false = await calculateOvertime({
                userId: id,
                userType: role,
                eId,
                extraHours,
                overtimeRate,
            });
            if (data) {
                return data;
            }
            setIsLoading(false);
            return false;
        },
        [id, role]
    );

    return { isLoading, getOvertimeDetails };
}
