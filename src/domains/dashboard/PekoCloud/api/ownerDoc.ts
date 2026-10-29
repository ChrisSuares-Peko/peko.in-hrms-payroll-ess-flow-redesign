import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    OwnerDocListingResponse,
    userPayload,
    OwnerCreatePayload,
    OwnerCreateResponse,
    //  OwnerUpdatePayload,
    employeeDeletePayload,
} from '../types/ownerDoc';

export const ownersList = async (payload: userPayload & { sort: string }) => {
    try {
        const res: SuccessGenericResponse<OwnerDocListingResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/owners?sort=${payload.sort}`
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
export const createOwnerDoc = async (payload: OwnerCreatePayload) => {
    try {
        const res: SuccessGenericResponse<OwnerCreateResponse> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/owners`,
            payload
        );

        return res;
    } catch (error) {
        return false;
    }
};

export const ownerDocUpdate = async ({ userType, userId, ownerId, ...payload }: any) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.put(
            `${userType}/${userId}/officeAndBusiness/peko-cloud/owners/${ownerId}`,
            payload
        );

        return resp;
    } catch (err) {
        return false;
    }
};

export const ownerDocDelete = async (payload: employeeDeletePayload) => {
    try {
        const res: SuccessGenericResponse<any> = await ApiClient.delete(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/owners/${payload.ownerId}`
        );

        return res;
    } catch (error) {
        return false;
    }
};
