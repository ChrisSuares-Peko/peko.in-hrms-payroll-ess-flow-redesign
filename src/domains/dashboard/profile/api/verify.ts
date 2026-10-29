import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    GSTDetailsResponse,
    verifyGSTPayload,
    verifyPANPayload,
    PANDetailsResponse,
} from '../types/index';

export const verifyGSTPan = async (payload: verifyGSTPayload) => {
    try {
        const resp: SuccessGenericResponse<GSTDetailsResponse> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/kyc/gstPanVerification`,
            payload
        );
        const data = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const verifyPAN = async (payload: verifyPANPayload) => {
    try {
        const resp: SuccessGenericResponse<PANDetailsResponse> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/kyc/panVerification`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const saveDoc = async (payload: verifyPANPayload) => {
    try {
        const resp: SuccessGenericResponse<PANDetailsResponse> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/kyc/saveDocs`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
