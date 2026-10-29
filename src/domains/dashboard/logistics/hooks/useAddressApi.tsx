import { useCallback, useEffect, useState } from 'react';

import { Flex, Typography } from 'antd';

import { useAppSelector } from '@src/hooks/store';

import { getSavedAddressApi } from '../api/address';
import { AddressOptions, Address } from '../types/address';

const formatAddressLine = (address: Address) =>
    [address.addressLine1, address.addressLine2, address.city, address.state, address.zipCode]
        .filter(Boolean)
        .join(', ');

export function useFetchAddressApi(receiver: boolean) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [addressOptions, setAddressOptions] = useState<AddressOptions[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const getAddress = useCallback(async () => {
        const data: Address[] | false = await getSavedAddressApi({
            userId: id,
            userType: role,
            isReceiver: receiver,
        });
        if (data) {
            const addressData = data as Address[];

            const arr: AddressOptions[] = addressData?.map((address, index) => ({
                label: (
                    <Flex vertical>
                        <Typography.Text ellipsis>{address.name}</Typography.Text>
                        <Typography.Text ellipsis type="secondary" className="text-xs">
                            {formatAddressLine(address)}
                        </Typography.Text>
                    </Flex>
                ),
                value: JSON.stringify({
                    id: address.id ?? index * 200,
                    name: address.name ?? '',
                    nickname: address.nickname ?? '',
                    country: address.country ?? 'IN',
                    state: address.state ?? '',
                    city: address.city ?? '',
                    address: `${address?.addressLine1}${address.addressLine2 ? ', ' : ''}\n${address?.addressLine2}`,
                    zipCode: address.zipCode ?? '',
                    email: address.email ?? '',
                    phoneNumber: address.phoneNumber ?? '',
                    addressType: address.addressType ?? '',
                }),
            }));
            setAddressOptions(arr);
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [id, role, receiver]);

    useEffect(() => {
        getAddress();
    }, [getAddress]);

    return { addressOptions, isLoading };
}
