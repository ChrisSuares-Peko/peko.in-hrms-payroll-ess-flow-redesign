import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    SavedAddressPayload,
    Address,
    SaveMerchantPayload,
    SavedMerchantResponse,
} from '../types/address';

export const getSavedAddressApi = async ({ isReceiver, userId, userType }: SavedAddressPayload) => {
    try {
        const resp: SuccessGenericResponse<Address[]> = await ApiClient.get(
            `${userType}/${userId}/travel/logistics/fetchAddresses?isReceiver=${isReceiver}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const saveMerchantApi = async ({ userType, userId, ...body }: SaveMerchantPayload) => {
    try {
        const res: SuccessGenericResponse<SavedMerchantResponse> = await ApiClient.post(
            `${userType}/${userId}/travel/logistics/createMerchant`,
            body
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
