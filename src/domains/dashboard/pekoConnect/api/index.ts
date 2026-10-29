import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

export const getProfiles = async (ids: number[]) => {
    try {
        // const queryString = ids.map(id => `ids[]=${id}`).join('&');
        const response: SuccessGenericResponse<any> = await ApiClient.get(`user/chat/profile`);
        const { data } = response;
        return data;
    } catch (err) {
        return null;
    }
};

export const postChatImage = async (payload: { image: string; imageFormat: string }) => {
    try {
        const response: SuccessGenericResponse<any> = await ApiClient.post(
            'user/chat/upload',
            payload
        );
        const { data } = response;
        return data;
    } catch (err) {
        return null;
    }
};

export const postChatFile = async (payload: {
    file: string;
    fileFormat: string;
    fileName: string;
}) => {
    try {
        const response: SuccessGenericResponse<any> = await ApiClient.post(
            'user/chat/upload',
            payload
        );
        const { data } = response;
        return data;
    } catch (err) {
        return null;
    }
};

export const getRequests = async () => {
    try {
        const response: SuccessGenericResponse<any> = await ApiClient.get('user/chat/request');
        const { data } = response;
        return data;
    } catch (err) {
        return null;
    }
};

export const postRequest = async (payload: { receiverId: string; message: string }) => {
    try {
        const response: SuccessGenericResponse<any> = await ApiClient.post(
            'user/chat/request',
            payload
        );
        const { data } = response;
        return data;
    } catch (err) {
        return null;
    }
};

export const putRequest = async (payload: { requestId: string; status: string }) => {
    try {
        const response: SuccessGenericResponse<any> = await ApiClient.put(
            'user/chat/request',
            payload
        );
        const { data } = response;
        return data;
    } catch (err) {
        return null;
    }
};

export const getToken = async () => {
    try {
        const response: SuccessGenericResponse<any> = await ApiClient.get('user/chat');
        const { data } = response;
        return data;
    } catch (err) {
        return null;
    }
};

export const getCorporates = async ({ searchText }: { searchText: string }) => {
    try {
        const response: SuccessGenericResponse<any> = await ApiClient.get('user/chat/corporates', {
            params: { searchText },
        });
        const { data } = response;
        return data;
    } catch (err) {
        return null;
    }
};
