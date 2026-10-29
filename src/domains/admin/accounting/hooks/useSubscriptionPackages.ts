import { useCallback, useEffect, useState } from 'react';

import { putUpdatePackageStatus } from '@src/domains/admin/settings/api/package';
import { PackageFilters, updatePackageStatus } from '@src/domains/admin/settings/types/package';
import { useAppSelector } from '@src/hooks/store';

import { getSubscriptionPackages } from '../api/catalog';
import { SubscriptionPackage } from '../types/catalog';

const useSubscriptionPackages = (filters: PackageFilters) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [rows, setRows] = useState<SubscriptionPackage[]>([]);
    const [count, setCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [refresh, setRefresh] = useState(0);

    const handleRefresh = useCallback(() => setRefresh(value => value + 1), []);

    useEffect(() => {
        let cancelled = false;
        setIsLoading(true);
        getSubscriptionPackages({ userId: id, userType: role, ...filters }).then(data => {
            if (cancelled) return;
            if (data) {
                setRows(data.data);
                setCount(data.recordsTotal);
            }
            setIsLoading(false);
        });
        return () => {
            cancelled = true;
        };
    }, [id, role, filters, refresh]);

    const updateActiveStatus = useCallback(
        async ({ packageId, status }: updatePackageStatus) => {
            setIsLoading(true);
            const saved = await putUpdatePackageStatus({
                userId: id,
                userType: role,
                packageId,
                status,
            });
            if (saved) handleRefresh();
            else setIsLoading(false);
        },
        [id, role, handleRefresh]
    );

    return { rows, count, isLoading, handleRefresh, updateActiveStatus };
};

export default useSubscriptionPackages;
