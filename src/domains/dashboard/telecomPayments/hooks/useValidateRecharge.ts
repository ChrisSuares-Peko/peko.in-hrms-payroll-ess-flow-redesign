import { useCallback, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { validateRechargeAmount } from '../api/index';
import { validateRechargePayload, ValidationResponse } from '../types';

export default function useValidateRecharge() {
    const [isLoading, setIsLoading] = useState(true);
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const validateRecharge = useCallback(
        async (payload: validateRechargePayload): Promise<ValidationResponse> => {
            const data = await validateRechargeAmount({
                ...payload,
                userType: role,
                userId: id,
            });
console.log("DATA",data)
            setIsLoading(false);
            if (data === false) {
                throw new Error('Validation failed');
            }
            return data;
        },
        [role, id]
    );

    return { isLoading, validateRecharge };
}
