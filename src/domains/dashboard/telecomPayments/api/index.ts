import { SuccessGenericResponse } from '@customtypes/api';
import { ApiClient } from '@src/services/config';

import {
    BeneficiariesResponse,
    CommonPayload,
    FetchBillResponse,
    GetServiceProvidersPayload,
    JriBalanceResponse,
    NumberDetailsPayload,
    PostpaidPaymentPayload,
    PrepaidPaymentPayload,
    PrepaidPlansPayload,
    PrepaidPlansResponse,
    SendOtpPayload,
    ServiceBeneficiaryPayload,
    ServiceProviderResponse,
    StateListResponse,
    ValidationResponse,
    addEditBeneficiaryPayload,
    deleteBeneficicaryPayload,
    validateRechargePayload,
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

export const getNumberDetails = async (payload: NumberDetailsPayload) => {
    try {
        const res: SuccessGenericResponse<{}> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payment/prepaid/details?number=${payload.number}`
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const validateRechargeAmount = async (payload: validateRechargePayload) => {
    try {
        const res: SuccessGenericResponse<ValidationResponse> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/payment/prepaid/validate`,
            payload
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const getPrepaidPlans = async (payload: PrepaidPlansPayload) => {
    try {
        const res: SuccessGenericResponse<PrepaidPlansResponse> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/payment/prepaid/plans`,
            payload
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const JRIVendorBalance = async (
    payload: CommonPayload & { amount: number; serviceProvider: string }
) => {
    try {
        const res: SuccessGenericResponse<JriBalanceResponse> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/payment/prepaid/balance`,
            payload
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const prepaidPayment = async (payload: PrepaidPaymentPayload) => {
    try {
        const res: SuccessGenericResponse<{}> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/payment/prepaid/payment`,
            payload
        );
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
            { params: { categoryName: payload.categoryName, searchText: payload.searchText } }
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
            `${payload.userType}/${payload.userId}/payment/postpaid/fetchBill`,
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
            `${payload.userType}/${payload.userId}/payment/postpaid/billValidation`,
            payload
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
export const fetchBillTest = async (payload: any) => {
    try {
        const res: SuccessGenericResponse<FetchBillResponse> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/payment/test/fetchBill`,
            payload
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
export const postpaidPayment = async (payload: PostpaidPaymentPayload) => {
    try {
        const res: SuccessGenericResponse<{}> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/payment/postpaid/payment`,
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
            `${payload.userType}/${payload.userId}/others/beneficiary/telecom`
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
            `${payload.userType}/${payload.userId}/others/beneficiary/fetchBeneficiary`,
            {
                params: {
                    accessKey: payload.accessKey,
                },
            }
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

export const deleteBeneficiaryApi = async (payload: deleteBeneficicaryPayload) => {
    try {
        const resp: SuccessGenericResponse<BeneficiariesResponse> = await ApiClient.delete(
            `${payload.userType}/${payload.userId}/others/beneficiary/${payload.id}`
        );
        return resp;
    } catch (err) {
        return false;
    }
};
