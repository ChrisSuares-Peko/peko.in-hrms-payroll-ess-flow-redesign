import { useCallback, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { incrementAmountCalculate } from '../../../api/employeeSalaryApi/incrementApi/index';
import { incrementAmountResponse } from '../../../types/salaryProfileTypes/incrementTypes';

export default function GetIncrementAmount() {
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const [isLoading, setIsLoading] = useState(true);

    const getIncrementDetails = useCallback(
        async (
            eId: string | undefined,
            type: string,
            value: number | string,
            basicSalaries: number
        ) => {
            let payload = {
                userId: id,
                userType: role,
                eId,
                type,
                incrementPercentage: '',
                incrementAmount: '',
                basicSalary: basicSalaries,
            };
            if (type === 'percentage') {
                payload = {
                    ...payload,
                    incrementPercentage: value.toString(),
                    basicSalary: basicSalaries,
                };
            } else if (type === 'flat') {
                payload = {
                    ...payload,
                    incrementAmount: value.toString(),
                    basicSalary: basicSalaries,
                };
            }

            const data: incrementAmountResponse | false = await incrementAmountCalculate(payload);

            setIsLoading(false);
            if (data) {
                return data;
            }
            setIsLoading(false);
            return null;
        },
        [id, role]
    );

    return { isLoading, getIncrementDetails };
}
