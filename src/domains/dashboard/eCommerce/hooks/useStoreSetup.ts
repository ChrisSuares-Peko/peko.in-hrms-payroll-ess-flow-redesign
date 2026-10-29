import { useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { setupTenant } from '../api/tenantApi';
import { SetupTenantPayload } from '../types/tenant';

export type StoreSetupResult = { ok: true } | { ok: false; message: string };

export function useStoreSetup() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);

    const setupStore = async (payload: SetupTenantPayload): Promise<StoreSetupResult> => {
        setIsLoading(true);
        const resp = await setupTenant({
            userId: id,
            userType: role,
            ...payload,
        });
        setIsLoading(false);
        if (resp.ok) return { ok: true };
        return { ok: false, message: resp.message };
    };

    return { setupStore, isLoading };
}
