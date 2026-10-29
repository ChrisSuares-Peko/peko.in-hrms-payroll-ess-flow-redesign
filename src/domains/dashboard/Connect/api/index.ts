import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    ConnectDetailPayload,
    ConnectDetailResponse,
    ConnectListResponse,
    ConnectPayload,
    ConnectRequestPayload,
    ConnectRequestResponse,
} from '../types/index';

export const getServiceList = async (payload: ConnectPayload) => {
    try {
        const resp: SuccessGenericResponse<ConnectListResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/pekoConnect/providers`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getServiceDetails = async (payload: ConnectDetailPayload) => {
    try {
        const resp: SuccessGenericResponse<ConnectDetailResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/pekoConnect/details/${payload.serviceID}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const postConnectRequest = async (payload: ConnectRequestPayload) => {
    try {
        const resp: SuccessGenericResponse<ConnectRequestResponse> = await ApiClient.post(
            `${payload.userType}/${payload.credentialId}/officeAndBusiness/pekoConnect`,
            payload
        );
        const { data } = resp;

        return data;
    } catch (err) {
        return false;
    }
};
