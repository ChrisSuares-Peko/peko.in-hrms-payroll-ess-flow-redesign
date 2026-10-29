import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getSavedAddressApi } from '../../api/address';
import { AddressFieldValue } from '../../types/address';

export interface AddressOption {
    label: string;
    value: string; // JSON stringified AddressFieldValue
}

export const useSavedAddresses = (isReceiver: boolean, refreshKey = 0) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [options, setOptions] = useState<AddressOption[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchAddresses = useCallback(async () => {
        setIsLoading(true);
        const data = await getSavedAddressApi({ userId: id, userType: role, isReceiver });
        if (data) {
            const arr = data.addresses.map((address, index) => ({
                label: address.name,
                value: JSON.stringify({
                    id: address.id ?? index * 200,
                    name: address.name ?? '',
                    country: address.country ?? '',
                    countryCode: address.countryCode ?? '',
                    state: address.state ?? '',
                    city: address.city ?? '',
                    address1: address.addressLine1 ?? '',
                    address2: address.addressLine2 ?? '',
                    zipCode: address.zipCode ?? '',
                    phoneNumber: address.phoneNumber ?? '',
                    phoneCode: address.phoneCode ?? '',
                    email: address.email ?? '',
                } as AddressFieldValue),
            }));
            setOptions(arr);
        }
        setIsLoading(false);
    }, [id, role, isReceiver]);

    useEffect(() => {
        fetchAddresses();
    }, [fetchAddresses, refreshKey]);

    const parseAddress = (value: string): AddressFieldValue | null => {
        try { return JSON.parse(value); } catch { return null; }
    };

    return { options, isLoading, refetch: fetchAddresses, parseAddress };
};
