import { useCallback, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { syncTunzPlans } from '../api/eSIM';

const useTunzSyncPlans = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);

    const syncPlansTunz = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await syncTunzPlans({ userId: id, userType: role });
            return data;
        } finally {
            setIsLoading(false);
        }
    }, [id, role]);

    return { isLoading, syncPlansTunz };
};

export default useTunzSyncPlans;
