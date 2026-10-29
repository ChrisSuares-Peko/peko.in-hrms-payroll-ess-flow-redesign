import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    CreateEmailLayoutPayload,
    EmailLayout,
    EmailLayoutListParams,
    EmailLayoutListResponse,
    UpdateEmailLayoutDraftPayload,
} from '../types/emailLayout';

// Sibling router to api/emailTemplates.ts, same officeAndBusiness base path.
const basePath = (userType: string, userId: number) =>
    `${userType}/${userId}/officeAndBusiness/email-layouts`;

export const getEmailLayouts = async (payload: UserPayload & EmailLayoutListParams) => {
    try {
        const { userType, userId, ...params } = payload;
        const resp: SuccessGenericResponse<EmailLayoutListResponse> = await ApiClient.get(
            basePath(userType, userId),
            { params }
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const getEmailLayout = async (payload: UserPayload & { id: number }) => {
    try {
        const resp: SuccessGenericResponse<EmailLayout> = await ApiClient.get(
            `${basePath(payload.userType, payload.userId)}/${payload.id}`
        );
        return resp.data;
    } catch {
        return false;
    }
};

// draftHtml is sent as plain HTML — no Base64 encoding, matching
// api/emailTemplates.ts's draftHtmlBody.
export const createEmailLayout = async (payload: UserPayload & CreateEmailLayoutPayload) => {
    try {
        const { userType, userId, ...body } = payload;
        body.partnerId = body.partnerId ? String(body.partnerId) : null;
        const resp: SuccessGenericResponse<EmailLayout> = await ApiClient.post(
            basePath(userType, userId),
            body
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const updateEmailLayoutDraft = async (
    payload: UserPayload & { id: number } & UpdateEmailLayoutDraftPayload
) => {
    try {
        const { userType, userId, id, ...body } = payload;
        body.partnerId = body.partnerId ? String(body.partnerId) : null;
        const resp: SuccessGenericResponse<EmailLayout> = await ApiClient.put(
            `${basePath(userType, userId)}/${id}`,
            body
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const publishEmailLayout = async (payload: UserPayload & { id: number }) => {
    try {
        const resp: SuccessGenericResponse<EmailLayout> = await ApiClient.post(
            `${basePath(payload.userType, payload.userId)}/${payload.id}/publish`
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const setEmailLayoutActive = async (
    payload: UserPayload & { id: number; isActive: boolean }
) => {
    try {
        const resp: SuccessGenericResponse<EmailLayout> = await ApiClient.patch(
            `${basePath(payload.userType, payload.userId)}/${payload.id}/active`,
            { isActive: payload.isActive }
        );
        return resp.data;
    } catch {
        return false;
    }
};
