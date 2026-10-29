import { useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { checkGlobalBusinessSetupStatus } from '../api/globalBusinessSetup';

export function useGlobalBusinessSetupStatus() {
    const [loading, setLoading] = useState(true);
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const [hasPurchasedGlobalBusinessSetup, setHasPurchasedGlobalBusinessSetup] = useState(false);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await checkGlobalBusinessSetupStatus({ userType: role, userId: id });
                setHasPurchasedGlobalBusinessSetup(Boolean(res?.hasPurchasedGlobalBusinessSetup));
            } finally {
                setLoading(false);
            }
        };

        fetchStatus();
    }, [id, role]);

    return { loading, hasPurchasedGlobalBusinessSetup };
}
