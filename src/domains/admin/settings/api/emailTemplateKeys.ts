import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    CreateEmailTemplateKeyPayload,
    EmailTemplateKey,
    EmailTemplateKeyListParams,
    EmailTemplateKeyListResponse,
    UpdateEmailTemplateKeyVariablesPayload,
} from '../types/emailTemplateKey';

const basePath = (userType: string, userId: number) =>
    `${userType}/${userId}/officeAndBusiness/email-template-keys`;

export const getEmailTemplateKeyList = async (
    payload: UserPayload & EmailTemplateKeyListParams
) => {
    try {
        const { userType, userId, ...params } = payload;
        const resp: SuccessGenericResponse<EmailTemplateKeyListResponse> = await ApiClient.get(
            basePath(userType, userId),
            { params }
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const createEmailTemplateKey = async (
    payload: UserPayload & CreateEmailTemplateKeyPayload
) => {
    try {
        const { userType, userId, ...body } = payload;
        const resp: SuccessGenericResponse<EmailTemplateKey> = await ApiClient.post(
            basePath(userType, userId),
            body
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const setEmailTemplateKeyActive = async (
    payload: UserPayload & { id: number; isActive: boolean }
) => {
    try {
        const resp: SuccessGenericResponse<EmailTemplateKey> = await ApiClient.patch(
            `${basePath(payload.userType, payload.userId)}/${payload.id}/active`,
            { isActive: payload.isActive }
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const updateEmailTemplateKeyVariables = async (
    payload: UserPayload & UpdateEmailTemplateKeyVariablesPayload
) => {
    try {
        const { userType, userId, ...body } = payload;
        const resp: SuccessGenericResponse<EmailTemplateKey> = await ApiClient.put(
            `${basePath(userType, userId)}/variables`,
            body
        );
        return resp.data;
    } catch {
        return false;
    }
};
