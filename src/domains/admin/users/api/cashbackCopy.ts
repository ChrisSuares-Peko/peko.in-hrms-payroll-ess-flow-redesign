import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    AddCashbacksPayload,
    AddCashbacksResult,
    ClonePackagePayload,
    CopyComparePayload,
    CopyPackage,
} from '../types/cashbackCopy';

export const getCopyCashbackCompareApi = async (
    payload: UserPayload & { fromPartnerId: string; toPartnerId: string }
) => {
    try {
        const resp: SuccessGenericResponse<CopyComparePayload> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/cashback/copy/compare`,
            {
                params: {
                    fromPartnerId: payload.fromPartnerId,
                    toPartnerId: payload.toPartnerId,
                },
            }
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const postAddCashbacksToPackageApi = async (payload: UserPayload & AddCashbacksPayload) => {
    try {
        const resp: SuccessGenericResponse<AddCashbacksResult> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/others/cashback/copy/add-to-package`,
            {
                toPackageId: payload.toPackageId,
                sourceCashbackIds: payload.sourceCashbackIds,
            }
        );
        return resp;
    } catch (err) {
        return false;
    }
};

export const postClonePackageToPartnerApi = async (payload: UserPayload & ClonePackagePayload) => {
    try {
        const resp: SuccessGenericResponse<CopyPackage> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/others/cashback/copy/clone-package`,
            {
                fromPackageId: payload.fromPackageId,
                toPartnerId: payload.toPartnerId,
                overrides: payload.overrides,
            }
        );
        return resp;
    } catch (err) {
        return false;
    }
};
