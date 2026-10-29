import { useCallback, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { bonusAmountCalculate } from '../../../api/employeeSalaryApi/bonusApi/index';
import { bonusAmountResponse } from '../../../types/salaryProfileTypes/bonustypes/index';

export default function GetBonusAmount() {
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const [isLoading, setIsLoading] = useState(true);

    const getBonusDetails = useCallback(
        async (eId: string | undefined, type: string, value: number | string) => {
            let payload = {
                userId: id,
                userType: role,
                eId,
                type,
                bonusPercentage: '',
                bonusAmount: '',
            };
            if (type === 'percentage') {
                payload = { ...payload, bonusPercentage: value.toString() };
            } else if (type === 'flat') {
                payload = { ...payload, bonusAmount: value.toString() };
            }

            const data: bonusAmountResponse | false = await bonusAmountCalculate(payload);

            setIsLoading(false);
            if (data) {
                return data;
            }
            setIsLoading(false);
            return null;
        },
        [id, role]
    );

    return { isLoading, getBonusDetails };
}
