// import { UserPayload } from '@src/domains/dashboard/TaxAndMore/types/types';

import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    activeResponse,
    Data,
    getData,
    newTemplate,
    Template,
    updateStatus,
} from '../types/invoiceTemplates';

interface UserPayload {
    userId: number;
    userType: string;
}

export const getTemplate = async (payload: UserPayload & getData) => {
    try {
        const resp: SuccessGenericResponse<Data> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/invoice-templete/get-templates`,
            {
                params: {
                    sort: payload.sort,
                    page: payload.page,
                    itemsPerPage: payload.itemsPerPage,
                    searchText: payload.searchText,
                    sortField: payload.sortField,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const updateTemplate = async ({
    userType,
    userId,
    ...payload
}: UserPayload & newTemplate) => {
    try {
        const { id, ...restpayload } = payload;
        const resp: SuccessGenericResponse<Template> = await ApiClient.put(
            `${userType}/${userId}/officeAndBusiness/invoice-templete/${id}`,
            restpayload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const createTemplate = async (payload: UserPayload & newTemplate) => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, userId, userType, ...restpayload } = payload;
        const resp: SuccessGenericResponse<Template> = await ApiClient.post(
            `${userType}/${userId}/officeAndBusiness/invoice-templete`,
            restpayload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const deleteTemplate = async (payload: UserPayload & { id: number }) => {
    try {
        const resp: SuccessGenericResponse<activeResponse> = await ApiClient.delete(
            `${payload.userType}/${payload.userId}/officeAndBusiness/invoice-templete/${payload.id}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const updateCurrentStatus = async ({
    userId,
    userType,
    ...payload
}: UserPayload & updateStatus) => {
    try {
        const { templateId } = payload;
        delete payload.templateId;
        const resp: SuccessGenericResponse<activeResponse> = await ApiClient.put(
            `${userType}/${userId}/officeAndBusiness/invoice-templete/updateStatus/${templateId}`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
