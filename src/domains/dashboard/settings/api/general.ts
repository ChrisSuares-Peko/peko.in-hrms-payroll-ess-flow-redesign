import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    AccountTypeResponse,
    ActivityResponse,
    AddressTypesResponse,
    CompanySizesResponse,
    CountriesResponse,
} from '../types/security';

export const getAddressTypes = async () => {
    try {
        const resp: SuccessGenericResponse<AddressTypesResponse> =
            await ApiClient.get(`user/general/addressType`);
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getCompanySizes = async () => {
    try {
        const resp: SuccessGenericResponse<CompanySizesResponse> =
            await ApiClient.get(`user/general/companySize`);
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getCountries = async () => {
    try {
        const resp: SuccessGenericResponse<CountriesResponse> =
            await ApiClient.get(`user/general/countries`);
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getActivities = async () => {
    try {
        const resp: SuccessGenericResponse<ActivityResponse> = await ApiClient.get(
            `user/general/companyActivity`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getAccountTypes = async () => {
    try {
        const resp: SuccessGenericResponse<AccountTypeResponse> = await ApiClient.get(
            `user/general/bank/accountType`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getOtp = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<{}> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/profile/get-otp-update?scope=email`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getOtpSms = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<{}> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/profile/get-otp?scope=sms`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
