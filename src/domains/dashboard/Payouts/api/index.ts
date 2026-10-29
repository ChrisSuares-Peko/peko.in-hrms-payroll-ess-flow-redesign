import { SuccessGenericResponse } from "@customtypes/api";
import { ApiClient } from '@src/services/config';

import { AddBeneficiaryPayload, AddDomesticBankAccountPayload, Beneficiary, DomesticBankAccount, GetAllPayoutsParams, GetAllPayoutsResponse, GetBeneficiariesParams, NupayOnboardingData, NupayOnboardingPayload, NupayOnboardingStatusData, NupayWalletBalance, OnboardingRecord, OtherBillPayload, OtherBillResponse, PayoutDashboardData, PayoutTransferPayload, PayoutTransferResponse, RentBillPayload, RentBillResponse, Step1Payload, Step2Payload, VerifyBankResponse } from '../types';

export const fetchDashboardDetails = async (payload: any) => {
    try {
        const res: SuccessGenericResponse<PayoutDashboardData> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payment/payout/dashboard`,
            payload
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const postBeneficiaryDetails = async (
    userType: string,
    userId: number,
    payload: AddBeneficiaryPayload
) => {
    try {
        const res: SuccessGenericResponse<Beneficiary> = await ApiClient.post(
            `${userType}/${userId}/payment/payout/beneficiary`,
            payload
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const putBeneficiaryDetails = async (
    userType: string,
    userId: number,
    beneficiaryId: number,
    payload: AddBeneficiaryPayload
) => {
    try {
        await ApiClient.put(
            `${userType}/${userId}/payment/payout/beneficiary/${beneficiaryId}`,
            payload
        );
        return true;
    } catch (error) {
        return false;
    }
};

export const deleteBeneficiaryDetails = async (
    userType: string,
    userId: number,
    beneficiaryId: number
) => {
    try {
        await ApiClient.delete(
            `${userType}/${userId}/payment/payout/beneficiary/${beneficiaryId}`
        );
        return true;
    } catch (error) {
        return false;
    }
};

export const fetchDomesticBankAccounts = async (userType: string, userId: number) => {
    try {
        const res: SuccessGenericResponse<DomesticBankAccount[]> = await ApiClient.get(
            `${userType}/${userId}/payment/bank-account/domestic`
        );
        return res.data;
    } catch (error) {
        return false;
    }
};

export const postDomesticBankAccount = async (
    userType: string,
    userId: number,
    payload: AddDomesticBankAccountPayload
) => {
    try {
        const res: SuccessGenericResponse<DomesticBankAccount> = await ApiClient.post(
            `${userType}/${userId}/payment/bank-account/domestic`,
            payload
        );
        return res.data;
    } catch (error) {
        return false;
    }
};

export const putDomesticBankAccount = async (
    userType: string,
    userId: number,
    accountId: number,
    payload: AddDomesticBankAccountPayload
) => {
    try {
        await ApiClient.put(
            `${userType}/${userId}/payment/bank-account/domestic/${accountId}`,
            payload
        );
        return true;
    } catch (error) {
        return false;
    }
};

export const deleteDomesticBankAccount = async (userType: string, userId: number, accountId: number) => {
    try {
        await ApiClient.delete(
            `${userType}/${userId}/payment/bank-account/domestic/${accountId}`
        );
        return true;
    } catch (error) {
        return false;
    }
};

export const setPrimaryDomesticBankAccount = async (userType: string, userId: number, accountId: number) => {
    try {
        await ApiClient.put(
            `${userType}/${userId}/payment/bank-account/domestic/${accountId}/primary`
        );
        return true;
    } catch (error) {
        return false;
    }
};

export const fetchBeneficiaryDetails = async (
    userType: string,
    userId: number,
    params?: GetBeneficiariesParams
) => {
    try {
        const res: SuccessGenericResponse<Beneficiary[]> = await ApiClient.get(
            `${userType}/${userId}/payment/payout/beneficiary`,
            { params }
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const postRentBill = async (
    userType: string,
    userId: number,
    payload: RentBillPayload
) => {
    try {
        const res: SuccessGenericResponse<RentBillResponse> = await ApiClient.post(
            `${userType}/${userId}/payment/payout/rent`,
            payload
        );
        return res.data;
    } catch (error) {
        return false;
    }
};

export const postOtherBill = async (
    userType: string,
    userId: number,
    payload: OtherBillPayload
) => {
    try {
        const res: SuccessGenericResponse<OtherBillResponse> = await ApiClient.post(
            `${userType}/${userId}/payment/payout/bill`,
            payload
        );
        return res.data;
    } catch (error) {
        return false;
    }
};

export const postPayoutTransfer = async (
    userType: string,
    userId: number,
    payload: PayoutTransferPayload
) => {
    try {
        const res: SuccessGenericResponse<PayoutTransferResponse> = await ApiClient.post(
            `${userType}/${userId}/payment/payout/transfer`,
            payload
        );
        return res.data;
    } catch (error) {
        return false;
    }
};

export const fetchPayoutStatus = async (
    userType: string,
    userId: number,
    transactionId: number
) => {
    try {
        const res: SuccessGenericResponse<PayoutTransferResponse> = await ApiClient.get(
            `${userType}/${userId}/payment/payout/transfer/${transactionId}/status`
        );
        return res.data;
    } catch (error) {
        return false;
    }
};

export const fetchAllPayouts = async (
    userType: string,
    userId: number,
    params?: GetAllPayoutsParams
): Promise<GetAllPayoutsResponse | false> => {
    try {
        const res: GetAllPayoutsResponse = await ApiClient.get(
            `${userType}/${userId}/payment/payout/transactions`,
            { params }
        );
        return res;
    } catch (error) {
        return false;
    }
};

export const getNupayWalletBalance = async (
    userType: string,
    userId: number
): Promise<NupayWalletBalance | null> => {
    try {
        const res: SuccessGenericResponse<NupayWalletBalance> = await ApiClient.get(
            `${userType}/${userId}/payment/nupay/wallet-balance`
        );
        return res.data;
    } catch {
        return null;
    }
};

export const getNupayOnboardingStatus = async (
    userType: string,
    userId: number
): Promise<NupayOnboardingStatusData | null> => {
    try {
        const res: SuccessGenericResponse<NupayOnboardingStatusData | null> = await ApiClient.get(
            `${userType}/${userId}/payment/nupay/onboarding-status`
        );
        return res.data;
    } catch {
        return null;
    }
};

export const postNupayOnboarding = async (
    userType: string,
    userId: number,
    payload: NupayOnboardingPayload
): Promise<NupayOnboardingData | false> => {
    try {
        const formData = new FormData();
        formData.append('merchant_name', payload.merchant_name);
        formData.append('contact_number', payload.contact_number);
        formData.append('official_email', payload.official_email);
        formData.append('city', payload.city);
        formData.append('state', payload.state);
        formData.append('pincode', payload.pincode);
        formData.append('website_url', payload.website_url);
        if (payload.bank_account_number) formData.append('bank_account_number', payload.bank_account_number);
        if (payload.ifsc_code) formData.append('ifsc_code', payload.ifsc_code);
        if (payload.bank_name) formData.append('bank_name', payload.bank_name);
        formData.append('cancelled_cheque', payload.cancelled_cheque);

        const res: SuccessGenericResponse<NupayOnboardingData> = await ApiClient.post(
            `${userType}/${userId}/payment/nupay/onboard`,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data', 'x-suppress-error-toast': 'true' } }
        );
        return res.data;
    } catch (error) {
        return false;
    }
};

export const exportPayouts = async (
    userType: string,
    userId: number,
    params?: GetAllPayoutsParams
): Promise<{ buffer: { type: string; data: number[] }; fileType: string } | { error: string }> => {
    try {
        const res = await ApiClient.get(
            `${userType}/${userId}/payment/payout/transactions/export`,
            { params }
        ) as any;
        if (res?.status && res?.data?.buffer) {
            return { buffer: res.data.buffer, fileType: res.data.fileType };
        }
        return { error: res?.message || 'Export failed' };
    } catch (error: any) {
        return { error: error?.response?.data?.message || 'Export failed' };
    }
};

export const getOnboardingStatus = async ({
    userId,
    userType,
}: {
    userId: string | number;
    userType: string;
}): Promise<OnboardingRecord | null | false> => {
    try {
        const resp: { data: OnboardingRecord | null } = await ApiClient.get(
            `${userType}/${userId}/payment/payment-links/onboarding/status`
        );
        return resp.data;
    } catch {
        return false;
    }
};
 
export const saveOnboardingPanStep = async ({
    userId,
    userType,
    pan,
}: {
    userId: string | number;
    userType: string;
    pan: string;
}): Promise<OnboardingRecord | false> => {
    try {
        const resp: { data: OnboardingRecord } = await ApiClient.post(
            `${userType}/${userId}/payment/payment-links/onboarding/step-pan`,
            { pan }
        );
        return resp.data;
    } catch {
        return false;
    }
};
 
export const saveOnboardingBankStep = async ({
    userId,
    userType,
    accountNumber,
    ifsc,
    bankName,
    name,
    phone,
}: {
    userId: string | number;
    userType: string;
    accountNumber: string;
    ifsc: string;
    bankName?: string;
    name: string;
    phone: string;
}): Promise<OnboardingRecord | false> => {
    try {
        const resp: { data: OnboardingRecord } = await ApiClient.post(
            `${userType}/${userId}/payment/payment-links/onboarding/step-bank`,
            { accountNumber, ifsc, bankName, name, phone }
        );
        return resp.data;
    } catch {
        return false;
    }
};
 
export const verifyBankDetails = async ({
    userId,
    userType,
    bankName,
    accountNumber,
    ifsc,
}: {
    userId: string | number;
    userType: string;
    bankName: string;
    accountNumber: string;
    ifsc: string;
}): Promise<VerifyBankResponse | false> => {
    try {
        const resp: { data: VerifyBankResponse } = await ApiClient.post(
            `${userType}/${userId}/payment/payment-links/onboarding/verify-bank`,
            { bankName, accountNumber, ifsc }
        );
        return resp.data;
    } catch {
        return false;
    }
};
 
export const saveOnboardingStep1 = async ({
    userId,
    userType,
    ...payload
}: Step1Payload): Promise<OnboardingRecord | false> => {
    try {
        const resp: { data: OnboardingRecord } = await ApiClient.post(
            `${userType}/${userId}/payment/payment-links/onboarding/step-1`,
            payload
        );
        return resp.data;
    } catch {
        return false;
    }
};
 
export const saveOnboardingStep2 = async ({
    userId,
    userType,
    ...payload
}: Step2Payload): Promise<OnboardingRecord | false> => {
    try {
        const resp: { data: OnboardingRecord } = await ApiClient.post(
            `${userType}/${userId}/payment/payment-links/onboarding/step-2`,
            payload
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const downloadPayoutReceipt = async (
    userType: string,
    userId: number,
    transactionId: number
): Promise<{ pdfBuffer: { type: string; data: number[] } } | { error: string }> => {
    try {
        const res = await ApiClient.get(
            `${userType}/${userId}/payment/payout/transactions/${transactionId}/receipt`,
            { params: { id: transactionId } }
        ) as any;
        if (res?.status && res?.data?.pdfBuffer) {
            return { pdfBuffer: res.data.pdfBuffer };
        }
        return { error: res?.message || 'Failed to download receipt' };
    } catch (error: any) {
        return { error: error?.response?.data?.message || 'Failed to download receipt' };
    }
};