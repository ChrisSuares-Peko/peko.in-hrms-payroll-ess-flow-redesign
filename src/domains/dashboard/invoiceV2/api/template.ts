import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { GetSettingsResponse } from '../types/settings';

export type InvoiceTemplate = {
    id: number;
    subject: string;
    imageUrl: string | null;
};

export const fetchTemplateSettings = async (
    payload: UserPayload
): Promise<InvoiceTemplate[] | false> => {
    try {
        const { userId, userType } = payload;
        const { data }: SuccessGenericResponse<InvoiceTemplate[]> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/invoicing/v2/invoice-templates`
        );
        return data ?? [];
    } catch {
        return false;
    }
};

export const saveTemplateSettings = async (
    payload: UserPayload & { templateId: number }
): Promise<GetSettingsResponse | false> => {
    try {
        const { userId, userType, templateId } = payload;
        const resp: SuccessGenericResponse<GetSettingsResponse> = await ApiClient.post(
            `${userType}/${userId}/officeAndBusiness/invoicing/v2/settings`,
            { templateSettings: { templateId } }
        );
        return resp.data;
    } catch {
        return false;
    }
};
