import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import type { FetchReminderDashboardPayload, ReminderDashboardData } from '../types/api/reminder';

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

export const cancelReminder = async (
    payload: Pick<FetchReminderDashboardPayload, 'userId' | 'userType'> & { id: number }
): Promise<boolean> => {
    try {
        const { userId, userType, id } = payload;
        await ApiClient.patch(
            `${userType}/${userId}/officeAndBusiness/invoice-guideline/${id}/cancel`
        );
        return true;
    } catch {
        return false;
    }
};

export const sendReminder = async (
    payload: Pick<FetchReminderDashboardPayload, 'userId' | 'userType'> & { id: number }
): Promise<boolean> => {
    try {
        const { userId, userType, id } = payload;
        await ApiClient.post(
            `${userType}/${userId}/officeAndBusiness/invoice-guideline/${id}/send`
        );
        return true;
    } catch {
        return false;
    }
};

export const fetchReminderDashboard = async (
    payload: FetchReminderDashboardPayload
): Promise<ReminderDashboardData | false> => {
    try {
        const { userId, userType, ...params } = payload;
        const resp: SuccessGenericResponse<ReminderDashboardData> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/invoice-guideline/dashboard`,
            { params }
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
