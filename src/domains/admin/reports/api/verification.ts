import { CommonFileBuffer, SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { getData } from '../types';

export const getAllTransaction = async (payload: any) => {
    try {
        const res: SuccessGenericResponse<any> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/verification/verification-history`,
            {
                params: {
                    from: payload.from,
                    to: payload.to,
                    searchText: payload.searchText,
                    sort: payload.sort,
                    page: payload.page,
                    filter: payload.filter,
                    itemsPerPage: 10,
                    sortField: payload.sortField,
                    status: payload.status,
                },
            }
        );
        const { data } = res;

        return data;
    } catch (error) {
        return false;
    }
};

export const getFileBufferReport = async (payload: UserPayload & getData) => {
    try {
        const resp: SuccessGenericResponse<CommonFileBuffer> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/verification/verification-history/${payload.type}`,
            {
                params: {
                    sort: payload.sort,
                    searchText: payload.searchText,
                    to: payload.to,
                    from: payload.from,
                    vendorId: payload.id,
                    status: payload.status,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
