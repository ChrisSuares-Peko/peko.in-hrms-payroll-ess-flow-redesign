import { SuccessGenericResponse } from '@customtypes/api';
import { ApiClient } from '@src/services/config';

import {
    CompanyInfoResponse,
    UpdateBasicInfoResponse,
    UpdateCompanyInfoRequestPayload,
    UpdateGstandPan,
    UpdateGstandPanResponse,
    UserPayload,
} from '../types/index';

export const getCompanyInfo = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<CompanyInfoResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/profile/company`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const updateCompanyInfo = async (payload: UpdateCompanyInfoRequestPayload) => {
    try {
        const resp: SuccessGenericResponse<UpdateBasicInfoResponse> = await ApiClient.patch(
            `${payload.userType}/${payload.userId}/others/profile`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const updateGstandPanDetails = async (payload: UpdateGstandPan) => {
    try {
        const resp: SuccessGenericResponse<UpdateGstandPanResponse> = await ApiClient.patch(
            `${payload.userType}/${payload.userId}/others/profile/pan-gst-verification`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
