import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    EmailDomainListResponse,
    EmailDomainPayload,
    EmailDomainPlansResponse,
    EmailDomainPlansPayload,
} from '../types/types';

export const getEmailDomains = async (payload: EmailDomainPayload) => {
    try {
        const resp: SuccessGenericResponse<EmailDomainListResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/software-subscriptions`,
            {
                params: {
                    searchText: payload.searchText,
                    start: payload.page,
                    page: payload.page,
                    itemsPerPage: payload.itemsPerPage,
                    draw: 1,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getEmailDomainPlans = async (payload: UserPayload & EmailDomainPlansPayload) => {
    try {
        const resp: SuccessGenericResponse<EmailDomainPlansResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/software-subscriptions/plans`,
            {
                params: {
                    productId: payload.productId,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
