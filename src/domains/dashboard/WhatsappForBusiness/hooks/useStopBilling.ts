import { useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { stopBillingProject } from '../api/index';

export function useStopBillingApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);

    const stopBilling = async (projectId: number) => {
        setIsLoading(true);

        const response = await stopBillingProject({
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
    return { stopBilling, isLoading };
}
