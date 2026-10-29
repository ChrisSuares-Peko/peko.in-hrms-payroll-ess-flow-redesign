import { useCallback, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import {
    bulkImportDomainHostingPlans,
    fetchVendorPlansByKey,
    fetchVendorProductKeys,
} from '../../api/domainHostingPlans';

export type KeyFetchStatus = 'pending' | 'loading' | 'done' | 'error';

export type KeyFetchState = {
    key: string;
    status: KeyFetchStatus;
};

const useAutoImportDomainHostingPlans = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [loadingKeys, setLoadingKeys] = useState(false);
    const [keysError, setKeysError] = useState(false);
    const [loadingPlans, setLoadingPlans] = useState(false);
    const [keyFetchStates, setKeyFetchStates] = useState<KeyFetchState[]>([]);
    const [importing, setImporting] = useState(false);

    const getProductKeys = useCallback(async () => {
        setLoadingKeys(true);
        setKeysError(false);
        const data = await fetchVendorProductKeys({ userId: id, userType: role });
        setLoadingKeys(false);
        if (!data) setKeysError(true);
        return data;
    }, [id, role]);

    const fetchAllPlans = useCallback(
        async (
            selectedKeys: string[],
            keyTypeOverrides: Record<string, string>,
            onProgress: (progress: number) => void
        ) => {
            setLoadingPlans(true);
            setKeyFetchStates(selectedKeys.map(k => ({ key: k, status: 'pending' })));

            const allPlans: any[] = [];
            await selectedKeys.reduce<Promise<void>>(async (previousStep, key, index) => {
                await previousStep;
                setKeyFetchStates(prev =>
                    prev.map(s => (s.key === key ? { ...s, status: 'loading' } : s))
                );
                const data = await fetchVendorPlansByKey({
                    userId: id,
                    userType: role,
                    productKey: key,
                });
                const status: KeyFetchStatus = data && Array.isArray(data) ? 'done' : 'error';
                setKeyFetchStates(prev => prev.map(s => (s.key === key ? { ...s, status } : s)));
                if (data && Array.isArray(data)) {
                    const overriddenType = keyTypeOverrides[key];
                    allPlans.push(
                        ...data.map((p: any) => ({
                            ...p,
                            planType: p.planType ?? overriddenType ?? null,
                        }))
                    );
                }
                onProgress(Math.round(((index + 1) / selectedKeys.length) * 100));
            }, Promise.resolve());

            setLoadingPlans(false);
            return allPlans;
        },
        [id, role]
    );

    const importPlans = useCallback(
        async (plans: any[]) => {
            setImporting(true);
            const data = await bulkImportDomainHostingPlans({ userId: id, userType: role, plans });
            setImporting(false);
            return data;
        },
        [id, role]
    );

    return {
        loadingKeys,
        keysError,
        loadingPlans,
        keyFetchStates,
        importing,
        getProductKeys,
        fetchAllPlans,
        importPlans,
    };
};

export default useAutoImportDomainHostingPlans;
