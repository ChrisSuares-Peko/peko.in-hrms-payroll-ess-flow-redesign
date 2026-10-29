import { useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getSavedAddressApi } from '../api/address';
import { Address } from '../types/address';

/**
 * Profile saved addresses for the location modal. Loads only while `enabled`
 * (the modal is open) so opening the picker is what hits the API, not every
 * Office Supplies page view.
 */
export function useSavedAddresses(enabled: boolean) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!enabled) return undefined;

        let cancelled = false;
        setIsLoading(true);
        (async () => {
            const data = await getSavedAddressApi({ userId: id, userType: role });
            if (cancelled) return;
            if (data) {
                const { addressDetails } = data;
                setAddresses(addressDetails || []);
            } else {
                setAddresses([]);
            }
            setIsLoading(false);
        })();

        return () => {
            cancelled = true;
        };
    }, [enabled, id, role]);

    return { addresses, isLoading };
}
