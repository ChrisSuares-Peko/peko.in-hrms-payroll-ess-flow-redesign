import { useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { reactivateBillingProject } from '../api/index';

export function useReActivateBillingApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);

    const reactivateBilling = async (projectId: number) => {
        setIsLoading(true);

        const response = await reactivateBillingProject({
            userId: id,
            userType: role,
            id: projectId,
        });

        if (response) {
            setIsLoading(false);
            return true;
        }

        setIsLoading(false);
        return false;
    };
    return { reactivateBilling, isLoading };
}
