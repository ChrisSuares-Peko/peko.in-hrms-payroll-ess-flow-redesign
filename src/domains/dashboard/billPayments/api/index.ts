import { SuccessGenericResponse } from '@customtypes/api';
import { ApiClient } from '@src/services/config';

import {
    BeneficiariesResponse,
    CommonPayload,
    FetchBillResponse,
    GetServiceProvidersPayload,
    SendOtpPayload,
    ServiceBeneficiaryPayload,
    ServiceProviderResponse,
    StateListResponse,
    addEditBeneficiaryPayload,
    deleteBeneficicaryPayload,
} from '../types/index';

export const stateOptions = async () => {
    try {
        const res: SuccessGenericResponse<StateListResponse> =
            await ApiClient.get(`/user/general/states`);
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const getServiceProvider = async (payload: GetServiceProvidersPayload) => {
    try {
        const res: SuccessGenericResponse<ServiceProviderResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payment/bbps/billers`,
            {
                params: {
                    categoryName: payload.categoryName,
                    page: payload.page,
                    itemsPerPage: payload.itemsPerPage,
                    searchText: payload.searchText,
                },
            }
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const fetchBill = async (payload: any) => {
    try {
        const res: SuccessGenericResponse<FetchBillResponse> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/payment/${payload.apiPath}/fetchBill`,
            payload
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const billValidation = async (payload: any) => {
    try {
        const res: SuccessGenericResponse<FetchBillResponse> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/payment/${payload.apiPath}/billValidation`,
            payload
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const getlatestbeneficiary = async (payload: CommonPayload) => {
    try {
        const res: SuccessGenericResponse<BeneficiariesResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/beneficiary/utility`
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const getServiceBeneficiary = async (payload: ServiceBeneficiaryPayload) => {
    try {
        const res: SuccessGenericResponse<BeneficiariesResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/beneficiary/fetchBeneficiary?accessKey=${payload.accessKey}`
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const getBeneficiaryOtp = async (payload: SendOtpPayload) => {
    try {
        const resp: SuccessGenericResponse<{}> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/others/beneficiary/otp`,
            {
                scope: 'email',
                type: payload.ActionType,
                accountNo: payload.accountNo,
                accessKey: payload.accessKey,
                beneficiaryId: payload.beneficiaryId,
            }
        );
        return resp;
    } catch (err) {
        return false;
    }
};

export const AddBeneficiaryApi = async (payload: addEditBeneficiaryPayload) => {
    try {
        const resp: SuccessGenericResponse<BeneficiariesResponse> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/others/beneficiary`,
            payload
        );
        return resp;
    } catch (err) {
        return false;
    }
};

export const updateBeneficiaryApi = async (payload: addEditBeneficiaryPayload) => {
    try {
        const resp: SuccessGenericResponse<BeneficiariesResponse> = await ApiClient.put(
            `${payload.userType}/${payload.userId}/others/beneficiary/${payload.id}`,
            payload
        );
        return resp;
    } catch (err) {
        return false;
    }
};

export const deleteBeneficiaryApi = async (
    payload: deleteBeneficicaryPayload & { scope?: string; otp?: string }
) => {
    try {
        const resp: SuccessGenericResponse<BeneficiariesResponse> = await ApiClient.delete(
            `${payload.userType}/${payload.userId}/others/beneficiary/${payload.id}?scope=${payload.scope}&otp=${payload.otp}`
        );
        return resp;
    } catch (err) {
        return false;
    }
};

export const updateBeneficiaryStatusApi = async ({ userId, userType, id, ...payload }: any) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.put(
            `${userType}/${userId}/others/beneficiary/updateStatus/${id}`,
            payload
        );
        return resp;
    } catch (err) {
        return false;
    }
};
export const complaintRegister = async (payload: any) => {
    try {
        const { userId, userType, ...updatedPayload } = payload;
        updatedPayload.payload.complaintType = 'Transaction';
        const res: SuccessGenericResponse<any> = await ApiClient.post(
            `${userType}/${userId}/payment/bbps/disputes`,
            updatedPayload.payload
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
export const complaintListing = async (payload: any) => {
    try {
        const res: SuccessGenericResponse<any> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payment/bbps/disputes`,
            {
                params: {
                    from: payload.from,
                    to: payload.to,
                    searchText: payload.searchText,
                    sort: payload.sort,
                    page: payload.page,
                    filter: payload.filter,
                    itemsPerPage: 10,
                    sortField: payload.sortField,
                },
            }
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
export const getAllTransaction = async (payload: any) => {
    try {
        const res: SuccessGenericResponse<any> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payment/bbps/transactionsHistory`,
            {
                params: {
                    from: payload.from,
                    to: payload.to,
                    searchText: payload.searchText,
                    sort: payload.sort,
                    page: payload.page,
                    filter: payload.filter,
                    itemsPerPage: 10,
                    sortField: payload.sortField,
                },
            }
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const disputeUpdateStatus = async (payload: any) => {
    try {
        const { userId, userType, id } = payload;
        const res: SuccessGenericResponse<any> = await ApiClient.put(
            `${userType}/${userId}/payment/bbps/disputeStatus/${id}`
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
