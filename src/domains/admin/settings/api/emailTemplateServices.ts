import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    CreateEmailTemplateServicePayload,
    EmailTemplateService,
    EmailTemplateServiceListParams,
    EmailTemplateServiceListResponse,
} from '../types/emailTemplateService';

const basePath = (userType: string, userId: number) =>
    `${userType}/${userId}/officeAndBusiness/email-template-services`;

export const getEmailTemplateServiceList = async (
    payload: UserPayload & EmailTemplateServiceListParams
) => {
    try {
        const { userType, userId, ...params } = payload;
        const resp: SuccessGenericResponse<EmailTemplateServiceListResponse> = await ApiClient.get(
            basePath(userType, userId),
            { params }
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const createEmailTemplateService = async (
    payload: UserPayload & CreateEmailTemplateServicePayload
) => {
    try {
        const { userType, userId, ...body } = payload;
        const resp: SuccessGenericResponse<EmailTemplateService> = await ApiClient.post(
            basePath(userType, userId),
            body
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const setEmailTemplateServiceActive = async (
    payload: UserPayload & { id: number; isActive: boolean }
) => {
    try {
        const resp: SuccessGenericResponse<EmailTemplateService> = await ApiClient.patch(
            `${basePath(payload.userType, payload.userId)}/${payload.id}/active`,
            { isActive: payload.isActive }
        );
        return resp.data;
    } catch {
        return false;
    }
};
