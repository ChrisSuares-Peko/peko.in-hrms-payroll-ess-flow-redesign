import { useCallback, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { addRules, updateRules } from '../api/chartOfAccount';
import { COArules, newCoaRules } from '../types/coaRules';

const useCreateRules = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);

    const createNewRules = useCallback(
        async (payload: newCoaRules) => {
            setIsLoading(true);
            const data: COArules | false = await addRules({
                userId: id,
                userType: role,
                ...payload,
            });
            if (data) {
                return true;
            }
            setIsLoading(false);
            return false;
        },
        [id, role]
    );

    const updateCurrentRules = useCallback(
        async (payload: newCoaRules) => {
            setIsLoading(true);
            const data: COArules | false = await updateRules({
                userId: id,
                userType: role,
                ...payload,
            });
            if (data) {
                return true;
            }
            setIsLoading(false);
            return false;
        },
        [id, role]
    );

    return {
        isLoading,
        createNewRules,
        updateCurrentRules,
    };
};

export default useCreateRules;
