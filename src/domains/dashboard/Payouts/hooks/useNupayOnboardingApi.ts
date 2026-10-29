import { useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { postNupayOnboarding } from '../api';
import { NupayOnboardingData, NupayOnboardingPayload } from '../types';

export default function useNupayOnboardingApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setLoading] = useState(false);
    const [data, setData] = useState<NupayOnboardingData | null>(null);

    const onboardMerchant = async (payload: NupayOnboardingPayload) => {
        setLoading(true);
        const res = await postNupayOnboarding(role, id, payload);
        if (res) setData(res);
        setLoading(false);
        return res;
    };

    return { onboardMerchant, data, isLoading };
}
