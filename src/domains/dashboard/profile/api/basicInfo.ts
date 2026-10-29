import { SuccessGenericResponse } from '@customtypes/api';
import { ApiClient } from '@src/services/config';

import {
    BasicInfoResponse,
    ChangePasswordRequestPayload,
    PasswordPolicyResponse,
    SubCorporateProfileResponse,
    UpdateBasicInfoRequestPayload,
    UpdateBasicInfoResponse,
    UserPayload,
    progressResponse,
} from '../types/index';

export const getBasicInfo = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<BasicInfoResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/profile/basic`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const updateBasicInfo = async (payload: UpdateBasicInfoRequestPayload) => {
    try {
        const resp: SuccessGenericResponse<UpdateBasicInfoResponse> = await ApiClient.patch(
            `${payload.userType}/${payload.userId}/others/profile`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const changePassword = async (payload: ChangePasswordRequestPayload) => {
    try {
        const resp: SuccessGenericResponse<{}> = await ApiClient.patch(
            `${payload.userType}/${payload.userId}/others/profile/changePassword`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const progress = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<progressResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/profile/progress`
        );

        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getSubCorporateBasicInfo = async () => {
    try {
        const resp: SuccessGenericResponse<SubCorporateProfileResponse> = await ApiClient.get(
            `user/sub-corporate/profile`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getPasswordPolicies = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<PasswordPolicyResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/password-policy`
        );
        const { data } = resp;
  
        return data;
    } catch (err) {
       
        return false;
    }
};
