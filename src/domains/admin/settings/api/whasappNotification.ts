import { CommonFileBuffer, SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    getData,
    whatsappResponse,
    whatsappResponseWithPagination,
} from '../types/whatsappNotification';

export const getAllData = async (payload: getData) => {
    try {
        const resp: SuccessGenericResponse<whatsappResponseWithPagination> = await ApiClient.get(
            `/user/whatsapp-notification?searchText=${payload.searchText}&page=${payload.page}&itemsPerPage=${payload.itemsPerPage}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const addNumber = async (payload: any) => {
    try {
        const resp: SuccessGenericResponse<whatsappResponse> = await ApiClient.post(
            `/user/whatsapp-notification`,
            {
                ...payload,
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const editNumber = async (currentNumber: string, updatedDetails: any) => {
    try {
        const resp: SuccessGenericResponse<whatsappResponse> = await ApiClient.put(
            `/user/whatsapp-notification`,
            {
                currentNumber,
                data: updatedDetails,
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const editStatus = async (whatsappNumber: string, status: boolean) => {
    try {
        const resp: SuccessGenericResponse<whatsappResponse> = await ApiClient.put(
            `/user/whatsapp-notification/whatsapp-status`,
            {
                whatsappNumber,
                status,
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const deleteNumber = async (whatsappNumber: string) => {
    try {
        const resp: SuccessGenericResponse<whatsappResponse> = await ApiClient.delete(
            `/user/whatsapp-notification/${whatsappNumber}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getFileBufferWhatsAppNumber = async (payload: getData) => {
    try {
        const resp: SuccessGenericResponse<CommonFileBuffer> = await ApiClient.get(
            `/user/whatsapp-notification/download/${payload.type}`,
            {
                params: {
                    // partnerId: payload.partnerId,
                    searchText: payload.searchText,
                    type: payload.type,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
