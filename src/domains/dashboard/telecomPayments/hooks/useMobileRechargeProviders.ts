import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getMobileRechargeProviders } from '../api/mobileRechargeProviders';
import { MobileRechargeProvidersResponse } from '../types/index';

export type PrepaidProviderOption = {
    value: string;
    label: string;
};

export default function useMobileRechargeProviders() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(true);
    const [prepaidProviders, setPrepaidProviders] = useState<PrepaidProviderOption[]>([]);

    const getProviders = useCallback(async () => {
        const data: MobileRechargeProvidersResponse | false = await getMobileRechargeProviders({
            userId: id,
            userType: role,
        });
        if (data) {
            setPrepaidProviders(
                data.map(provider => ({
                    value: provider.providerName,
                    label: provider.displayName,
                }))
            );
        }
        setIsLoading(false);
    }, [id, role]);

    useEffect(() => {
        getProviders();
    }, [getProviders]);

    return { prepaidProviders, isLoading };
}
