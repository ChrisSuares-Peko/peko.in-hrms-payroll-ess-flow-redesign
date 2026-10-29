import { useCallback, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import {
    getOnboardingStatus,
} from '../api';
import { OnboardingRecord } from '../types/index';

export const usePaymentLinkOnboarding = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [loading, setLoading] = useState(false);
    const [record, setRecord] = useState<OnboardingRecord | null>(null);

    const fetchStatus = useCallback(async () => {
        setLoading(true);
        const result = await getOnboardingStatus({ userId: id, userType: role });
        setLoading(false);
        if (result !== false) setRecord(result);
        return result;
    }, [id, role]);

   

    return {
        loading,
        record,
        fetchStatus,
       
    };
};
