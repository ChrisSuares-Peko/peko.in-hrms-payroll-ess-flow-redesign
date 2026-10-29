import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    CreateEmailTemplatePayload,
    EmailTemplate,
    EmailTemplateListParams,
    EmailTemplateListResponse,
    ImportEmailTemplatesPayload,
    ImportEmailTemplatesResponse,
    UpdateEmailTemplateDraftPayload,
} from '../types/emailTemplate';

const basePath = (userType: string, userId: number) =>
    `${userType}/${userId}/officeAndBusiness/email-templates`;

export const getEmailTemplates = async (payload: UserPayload & EmailTemplateListParams) => {
    try {
        const { userType, userId, ...params } = payload;
        const resp: SuccessGenericResponse<EmailTemplateListResponse> = await ApiClient.get(
            basePath(userType, userId),
            { params }
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const getEmailTemplate = async (payload: UserPayload & { id: number }) => {
    try {
        const resp: SuccessGenericResponse<EmailTemplate> = await ApiClient.get(
            `${basePath(payload.userType, payload.userId)}/${payload.id}`
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const createEmailTemplate = async (payload: UserPayload & CreateEmailTemplatePayload) => {
    try {
        const { userType, userId, ...body } = payload;
        // partnerId is stored/validated as a string.
        body.partnerId = body.partnerId ? String(body.partnerId) : null;
        const resp: SuccessGenericResponse<EmailTemplate> = await ApiClient.post(
            basePath(userType, userId),
            body
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const importEmailTemplates = async (payload: UserPayload & ImportEmailTemplatesPayload) => {
    try {
        const { userType, userId, ...body } = payload;
        const resp: SuccessGenericResponse<ImportEmailTemplatesResponse> = await ApiClient.post(
            `${basePath(userType, userId)}/import`,
            body
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const updateEmailTemplateDraft = async (
    payload: UserPayload & { id: number } & UpdateEmailTemplateDraftPayload
) => {
    try {
        const { userType, userId, id, ...body } = payload;
        body.partnerId = body.partnerId ? String(body.partnerId) : null;
        const resp: SuccessGenericResponse<EmailTemplate> = await ApiClient.put(
            `${basePath(userType, userId)}/${id}`,
            body
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const publishEmailTemplate = async (payload: UserPayload & { id: number }) => {
    try {
        const resp: SuccessGenericResponse<EmailTemplate> = await ApiClient.post(
            `${basePath(payload.userType, payload.userId)}/${payload.id}/publish`
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const setEmailTemplateActive = async (
    payload: UserPayload & { id: number; isActive: boolean }
) => {
    try {
        const resp: SuccessGenericResponse<EmailTemplate> = await ApiClient.patch(
            `${basePath(payload.userType, payload.userId)}/${payload.id}/active`,
            { isActive: payload.isActive }
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const getEmailTemplateServices = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<string[]> = await ApiClient.get(
            `${basePath(payload.userType, payload.userId)}/services`
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const getEmailTemplateKeysForService = async (
    payload: UserPayload & { service: string }
) => {
    try {
        const resp: SuccessGenericResponse<string[]> = await ApiClient.get(
            `${basePath(payload.userType, payload.userId)}/services/${payload.service}/keys`
        );
        return resp.data;
    } catch {
        return false;
    }
};

// Not currently called by the editor (it derives variables from the HTML directly
// instead) — kept available in case that changes.
export const getEmailTemplateKeyVariables = async (
    payload: UserPayload & { service: string; key: string }
) => {
    try {
        const resp: SuccessGenericResponse<string[]> = await ApiClient.get(
            `${basePath(payload.userType, payload.userId)}/services/${payload.service}/keys/${payload.key}/variables`
        );
        return resp.data;
    } catch {
        return false;
    }
};
