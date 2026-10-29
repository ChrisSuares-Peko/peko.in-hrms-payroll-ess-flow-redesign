import { useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getOnboardingProfileContext } from '../api';
import { OnboardingProfileContext } from '../types/paymentLinkTypes';

export const useOnboardingProfileContext = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [data, setData] = useState<OnboardingProfileContext | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setLoading(true);
            const result = await getOnboardingProfileContext({ userId: id, userType: role });
            if (!cancelled) {
                setData(result || null);
                setLoading(false);
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, [id, role]);

    return { data, loading };
};
