import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { CorporateListResponse, ServiceProviderData } from '../types/common';

export const getAllCorporates = async ({ userType, userId, searchText }: any) => {
    try {
        const res: SuccessGenericResponse<CorporateListResponse> = await ApiClient.get(
            `${userType}/${userId}/others/transferFunds/corporate-users?searchText=${searchText}`
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const getServiceOperatorsApi = async ({ userType, userId, searchText }: any) => {
    try {
        const resp: SuccessGenericResponse<ServiceProviderData> = await ApiClient.get(
            `${userType}/${userId}/others/cashback/fetchServiceOperator?searchText=${searchText}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
