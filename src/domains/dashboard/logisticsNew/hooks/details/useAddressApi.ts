import { useCallback, useEffect, useState } from 'react';

import { useFormikContext } from 'formik';

import { DropDown } from '@customtypes/general';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import { getSavedAddressApi } from '../../api/address';
import { updateShipmentDetails } from '../../slice/logisticsSlice';
import { ShipmentFormValues } from '../../types';
import { AddressFieldValue, SavedAddressResponse } from '../../types/address';

export function useFetchAddressApi(receiver: boolean) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const { setValues, values } = useFormikContext<ShipmentFormValues>();

    const [searchKey, setSearchKey] = useState('');
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    const [addressOptions, setAddressOptions] = useState<DropDown>([]);
    const [isLoading, setIsLoading] = useState(true);

    const getAddress = useCallback(async () => {
        const data: SavedAddressResponse | false = await getSavedAddressApi({
            userId: id,
            userType: role,
            isReceiver: receiver,
        });
        if (data) {
            const addressData = data as SavedAddressResponse;
            const arr = addressData?.addresses?.map((address, index) => ({
                label: address.name,
                value: JSON.stringify({
                    id: address.id ?? index * 200,
                    name: address.name ?? '',
                    country: address.country ?? '',
                    countryCode: address.countryCode ?? '',
                    city: address.city ?? '',
                    state: (address as any).state ?? '',
                    address1: `${address?.addressLine1}`,
                    address2: address?.addressLine2 ? `${address.addressLine2}` : '',
                    zipCode: address.zipCode ?? '',
                    phoneNumber: address.phoneNumber ?? '',
                    phoneCode: address.phoneCode ?? '',
                    email: address.email ?? '',
                }),
            }));
            setAddressOptions(arr);
        }
        setIsLoading(false);
    }, [id, role, receiver]);

    const handleOnSelectAddress = (value: string) => {
        try {
            const parsedValue: AddressFieldValue = JSON.parse(value);
            if (receiver) {
                setValues({
                    ...values,
                    receiverName: parsedValue.name || '',
                    receiverPhone: parsedValue.phoneNumber || '',
                    receiverEmail: (parsedValue as any).email || '',
                    receiverAddressLine: parsedValue.address1 || '',
                    receiverAddressLine2: (parsedValue as any).address2 || '',
                    receiverZipCode: parsedValue.zipCode || '',
                    receiverAddressId: parsedValue.id!,
                    receiverPhoneCode: parsedValue.phoneCode || '+91',
                });
                const cityUpdate: Record<string, string> = {};
                if ((parsedValue as any).city) cityUpdate.city = (parsedValue as any).city;
                if ((parsedValue as any).state) cityUpdate.state = (parsedValue as any).state;
                if (parsedValue.countryCode) cityUpdate.countryCode = parsedValue.countryCode;
                if (parsedValue.country) cityUpdate.countryName = parsedValue.country;
                if (Object.keys(cityUpdate).length > 0) {
                    dispatch(updateShipmentDetails({ destinationCity: cityUpdate }));
                }
            } else {
                setValues({
                    ...values,
                    senderName: parsedValue.name || '',
                    senderPhone: parsedValue.phoneNumber || '',
                    senderEmail: (parsedValue as any).email || '',
                    senderAddressLine: parsedValue.address1 || '',
                    senderAddressLine2: (parsedValue as any).address2 || '',
                    senderZipCode: parsedValue.zipCode || '',
                    senderAddressId: parsedValue.id!,
                });
            }
        } catch (error) {
            console.log('🚀 ~ handleOnSelectAddress ~ error:', error);
        }
    };

    const handleOnClearAddress = () => {
        if (receiver) {
            setValues({
                ...values,
                receiverName: '',
                receiverEmail: '',
                receiverPhone: '',
                receiverAddressLine: '',
                receiverAddressLine2: '',
                receiverZipCode: '',
            });
        } else {
            setValues({
                ...values,
                senderName: '',
                senderEmail: '',
                senderPhone: '',
                senderAddressLine: '',
                senderAddressLine2: '',
                senderZipCode: '',
            });
        }
    };

    useEffect(() => {
        getAddress();
    }, [getAddress]);

    return {
        addressOptions,
        isLoading,
        handleOnSelectAddress,
        handleOnClearAddress,
        searchKey,
        setSearchKey,
        selectedIndex,
        setSelectedIndex,
    };
}
