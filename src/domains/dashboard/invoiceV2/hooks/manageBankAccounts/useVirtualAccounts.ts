import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getPaymentOnboardingStatus } from '../../api/onboarding';
import { VirtualAccount } from '../../types/ManageBankAccounts';

let cachedVirtualAccounts: VirtualAccount[] | null = null;

const useVirtualAccounts = () => {
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const [accounts, setAccounts] = useState<VirtualAccount[]>(cachedVirtualAccounts ?? []);
    const [isLoading, setIsLoading] = useState(!cachedVirtualAccounts);

    const fetchData = useCallback(async () => {
        if (!cachedVirtualAccounts) setIsLoading(true);
        try {
            const resp = await getPaymentOnboardingStatus({ userId, userType });
            if (resp && resp.status && resp.data?.activatedAt && resp.data.virtualAccountNumber) {
                const d = resp.data;
                cachedVirtualAccounts = [
                    {
                        id: String(d.id ?? '1'),
                        name: d.businessName || '',
                        bankName: d.bankName || '',
                        accountNumber: d.virtualAccountNumber || '',
                        ifsc: d.ifsc || '',
                        currency: 'INR',
                        type: 'Domestic',
                    },
                ];
                setAccounts(cachedVirtualAccounts);
            } else {
                cachedVirtualAccounts = [];
                setAccounts([]);
            }
        } finally {
            setIsLoading(false);
        }
    }, [userId, userType]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { accounts, isLoading, fetchData };
};

export default useVirtualAccounts;
