import { CommonFileBuffer, SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    ApiResponseLegalTemplates,
    LegalTemplatesBody,
    LegalTemplatesFormValues,
    LegalTemplatesWithoutID,
    getLegalTemplates,
    updateLegalTemplatesStatusPayload,
} from '../types/legalTemplates';

export const getLegalTemplatesData = async (payload: UserPayload & getLegalTemplates) => {
    try {
        const resp: SuccessGenericResponse<ApiResponseLegalTemplates> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/legal-templates`,
            {
                params: {
                    page: payload.page,
                    searchText: payload.searchText,
                    itemsPerPage: payload.itemsPerPage,
                    sort: payload.sort,
                    sortField: payload.sortField,
                },
            }
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const updateLegalTemplatesStatus = async ({
    templateId,
    userId,
    userType,
}: UserPayload & updateLegalTemplatesStatusPayload) => {
    try {
        const resp: SuccessGenericResponse<{}> = await ApiClient.patch(
            `${userType}/${userId}/officeAndBusiness/legal-templates/${templateId}/toggle-status`
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const createLegalTemplate = async ({
    userDetails,
    bodyPayload,
}: {
    bodyPayload: LegalTemplatesWithoutID;
    userDetails: UserPayload;
}) => {
    try {
        const resp: SuccessGenericResponse<LegalTemplatesBody> = await ApiClient.post(
            `${userDetails.userType}/${userDetails.userId}/officeAndBusiness/legal-templates`,
            bodyPayload
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const updateLegalTemplate = async ({
    userId,
    userType,
    id,
    ...payload
}: UserPayload & LegalTemplatesFormValues) => {
    try {
        const resp: SuccessGenericResponse<{}> = await ApiClient.put(
            `${userType}/${userId}/officeAndBusiness/legal-templates/${id}`,
            payload
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const getLegalTemplatesExport = async (
    payload: UserPayload & { type: string; searchText?: string; sort?: string; sortField?: string }
) => {
    try {
        const resp: SuccessGenericResponse<CommonFileBuffer> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/legal-templates/export/${payload.type}`,
            {
                params: {
                    searchText: payload.searchText,
                    sort: payload.sort,
                    sortField: payload.sortField,
                },
            }
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const deleteLegalTemplate = async ({
    userId,
    userType,
    templateId,
}: UserPayload & { templateId: string | number }) => {
    try {
        const resp: SuccessGenericResponse<{}> = await ApiClient.delete(
            `${userType}/${userId}/officeAndBusiness/legal-templates/${templateId}`
        );
        return resp.data;
    } catch {
        return false;
    }
};
