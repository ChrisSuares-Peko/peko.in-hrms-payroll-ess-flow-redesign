import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    Address,
    SaveAddressPayload,
    SavedAddressPayload,
    SavedAddressResponse,
    UpdateAddressPayload,
    ValidateAddressPayload,
} from '../types/address';

export const getSavedAddressApi = async ({ isReceiver, userId, userType }: SavedAddressPayload) => {
    try {
        const resp: SuccessGenericResponse<Address[]> = await ApiClient.get(
            `${userType}/${userId}/travel/logistics_V3/fetchAddresses?isReceiver=${isReceiver}`
        );
        const addresses = resp.data;
        return { addresses: Array.isArray(addresses) ? addresses : [] } as SavedAddressResponse;
    } catch (err) {
        return false;
    }
};

export const saveAddressApi = async ({ userType, userId, ...body }: SaveAddressPayload) => {
    try {
        const res: SuccessGenericResponse<SaveAddressPayload> = await ApiClient.post(
            `${userType}/${userId}/travel/logistics_V3/addAddress`,
            body
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const updateAddressApi = async ({ userType, userId, addressId, ...body }: UpdateAddressPayload) => {
    try {
        const res: SuccessGenericResponse<Address> = await ApiClient.put(
            `${userType}/${userId}/travel/logistics_V3/updateAddress/${addressId}`,
            body
        );
        return res.data;
    } catch (error) {
        return false;
    }
};

export const deleteAddressApi = async ({
    userType,
    userId,
    addressId,
}: {
    userType: string;
    userId: number;
    addressId: number;
}) => {
    try {
        await ApiClient.delete(`${userType}/${userId}/travel/logistics_V3/deleteAddress/${addressId}`);
        return true;
    } catch (error) {
        return false;
    }
};

export const setDefaultAddressApi = async ({
    userType,
    userId,
    addressId,
}: {
    userType: string;
    userId: number;
    addressId: number;
}) => {
    try {
        await ApiClient.patch(`${userType}/${userId}/travel/logistics_V3/setDefaultAddress/${addressId}`);
        return true;
    } catch (error) {
        return false;
    }
};

export const validateAddressApi = async ({ userType, userId, address }: ValidateAddressPayload) => {
    try {
        const res: SuccessGenericResponse<SaveAddressPayload> = await ApiClient.post(
            `${userType}/${userId}/travel/logistics/validateAddress`,
            {
                address,
            }
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
