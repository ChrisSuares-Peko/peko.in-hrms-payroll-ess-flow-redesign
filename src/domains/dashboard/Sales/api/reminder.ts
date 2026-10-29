import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

type BasePayload = { userId: number; userType: string };

export const getAllGuidelines = async (
    payload: BasePayload & { invoiceId: number }
): Promise<any | false> => {
    try {
        const { userId, userType, invoiceId } = payload;
        const resp: SuccessGenericResponse<any> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/invoice-guideline/${invoiceId}`
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const updateGuideline = async (
    payload: BasePayload & { data: any[]; invoiceId: number }
): Promise<any | false> => {
    try {
        const { userId, userType, data, invoiceId } = payload;
        const resp: SuccessGenericResponse<any> = await ApiClient.put(
            `${userType}/${userId}/officeAndBusiness/invoice-guideline/update-guideline`,
            { data, invoiceId }
        );
        return resp.data ?? resp;
    } catch {
        return false;
    }
};

export const addGuideline = async (
    payload: BasePayload & { data: any[]; invoiceId: number }
): Promise<any | false> => {
    try {
        const { userId, userType, data, invoiceId } = payload;
        const newData = data.map((item: any) => {
            const newItem = { ...item };
            if (!newItem.sms) delete newItem.templet?.sms;
            if (!newItem.email) delete newItem.templet?.email;
            return newItem;
        });
        const resp: SuccessGenericResponse<any> = await ApiClient.post(
            `${userType}/${userId}/officeAndBusiness/invoice-guideline`,
            { data: newData, invoiceId }
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const getTemplate = async (payload: BasePayload): Promise<any | false> => {
    try {
        const { userId, userType } = payload;
        const resp: SuccessGenericResponse<any> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/invoice-templete`
        );
        return resp.data;
    } catch {
        return false;
    }
};
