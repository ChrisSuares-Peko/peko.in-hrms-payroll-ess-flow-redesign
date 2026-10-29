import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getSavedAddressApi } from '../api/address';
import { Address, AddressOptions, SavedAddressResponse } from '../types/address';

/** Delivery textarea — street lines only; pincode/city live in their own fields. */
const formatSavedDeliveryAddress = (address: Address) =>
    [address.addressLine1, address.addressLine2].filter(line => line?.trim()).join('\n');

export function useFetchAddressApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();

    const [addressOptions, setAddressOptions] = useState<AddressOptions[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const getAddress = useCallback(async () => {
        const data: SavedAddressResponse | false = await getSavedAddressApi({
            userId: id,
            userType: role,
        });
        if (data) {
            const addressData = data as SavedAddressResponse;
            const arr: AddressOptions[] = (addressData?.addressDetails || []).map(address => ({
                label: address.name,
                value: JSON.stringify({
                    address: formatSavedDeliveryAddress(address),
                    email: address.email ?? '',
                    phoneNumber: address.phoneNumber ?? '',
                    zipCode: address.zipCode ?? '',
                    contactName: address.name ?? '',
                    businessName: address.nickname ?? '',
                }),
            }));
            setAddressOptions(arr);
            setIsLoading(false);
        } else {
            // `false` means the request failed (see getSavedAddressApi). Say so —
            // otherwise an empty dropdown looks like "I have no saved addresses".
            dispatch(
                showToast({
                    description: 'Could not load your saved addresses. Please refresh to retry.',
                    variant: 'warning',
                })
            );
            setIsLoading(false);
        }
    }, [id, role, dispatch]);

    useEffect(() => {
        getAddress();
    }, [getAddress]);

    return { addressOptions, isLoading };
}
