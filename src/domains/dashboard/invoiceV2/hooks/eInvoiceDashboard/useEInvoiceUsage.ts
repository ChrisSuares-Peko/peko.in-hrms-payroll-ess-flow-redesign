import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { EInvoiceUsageApiResponse, getEInvoiceUsageApi } from '../../api/eInvoice';

const defaultUsage: EInvoiceUsageApiResponse = {
    used: 0,
    freeBaseLimit: 0,
    addonLimit: 0,
    maxLimit: 0,
    cycleStart: '',
    cycleEnd: '',
    currentPlanName: null,
    currentPlanBillingType: null,
    currentPlanAmountPaid: null,
    currentPlanStatus: null,
    lastEInvoiceCreatedAt: null,
};

const useEInvoiceUsage = () => {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const [usage, setUsage] = useState<EInvoiceUsageApiResponse>(defaultUsage);
    const [isLoading, setIsLoading] = useState(true);

    const fetchUsage = useCallback(async () => {
        setIsLoading(true);
        const data = await getEInvoiceUsageApi({ userId: id, userType: role });
        setIsLoading(false);
        if (data) setUsage(data);
    }, [id, role]);

    useEffect(() => {
        fetchUsage();
    }, [fetchUsage]);

    return { usage, isLoading, refresh: fetchUsage };
};

export default useEInvoiceUsage;
