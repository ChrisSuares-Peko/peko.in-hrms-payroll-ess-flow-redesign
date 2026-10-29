import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { CorporateCardLookupDetail, LookupListKind, PagedResult } from '../types';

const base = (userType: string, userId: number) => `${userType}/${userId}/corporate-cards/lookup`;

export const getCorporateCardLookup = async (
    userType: string,
    userId: number,
    corporateId: number
) => {
    try {
        const resp: SuccessGenericResponse<CorporateCardLookupDetail> = await ApiClient.get(
            `${base(userType, userId)}/${corporateId}`
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const getCorporateCardLookupList = async <T>(
    userType: string,
    userId: number,
    corporateId: number,
    kind: LookupListKind,
    params: { page: number; itemsPerPage: number }
) => {
    try {
        const resp: SuccessGenericResponse<PagedResult<T>> = await ApiClient.get(
            `${base(userType, userId)}/${corporateId}/${kind}`,
            { params }
        );
        return resp.data;
    } catch {
        return false;
    }
};
