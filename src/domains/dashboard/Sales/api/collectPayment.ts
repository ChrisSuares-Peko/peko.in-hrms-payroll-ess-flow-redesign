import { CommonFileBuffer, SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { GetAllManualPaymentsResponse, ManualPaymentRecord } from '../types/CollectPayment';

export const getPrimaryBankApi = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<{
            bankDetails: Array<{
                id: number;
                accountHolderName: string;
                accountNumber: string;
                bankName: string;
                ifscCode: string | null;
                bankBranch?: string;
                accountType: string;
                default: number;
                status: number;
            }>;
        }> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/profile/bank`
        );
        const { data } = resp;
        return data?.bankDetails?.find(b => b.default === 1) ?? null;
    } catch {
        return null;
    }
};

export const getBankDetailsOtpApi = async (
    payload: UserPayload & { accountNumber: string }
) => {
    try {
        const resp = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/profile/otp-bank-details`,
            { params: { scope: 'email', accountNumber: payload.accountNumber } }
        );
        return resp;
    } catch {
        return false;
    }
};

export const addDomesticBankApi = async (
    payload: UserPayload & {
        accountHolderName: string;
        accountNumber: string;
        accountType: string;
        bankBranch: string;
        bankName: string;
        default: boolean;
        ifscCode: string;
        otp: string;
    }
) => {
    try {
        const { userId, userType, ...body } = payload;
        const resp: SuccessGenericResponse<{ id: number }> = await ApiClient.post(
            `${userType}/${userId}/others/profile/bank`,
            { ...body, scope: 'email' }
        );
        return resp;
    } catch {
        return false;
    }
};

export const recordManualPaymentApi = async (
    payload: UserPayload & {
        invoiceId: string;
        amount: number;
        paymentMethod: string;
        paymentDate: string;
        referenceId?: string;
        notes?: string;
    }
) => {
    try {
        const { userId, userType, invoiceId, ...body } = payload;
        const resp: SuccessGenericResponse<{}> = await ApiClient.post(
            `${userType}/${userId}/officeAndBusiness/invoicing/v2/${invoiceId}/manual-payment`,
            body
        );
        return resp;
    } catch {
        return false;
    }
};

export const createPaymentLinkApi = async (
    payload: UserPayload & {
        amount: string;
        expiry_time: string;
        customerName?: string;
        customerPhone?: string;
        invoiceId?: string;
    }
) => {
    try {
        const { userId, userType, ...body } = payload;
        const resp: SuccessGenericResponse<{ paymentLink: string }> = await ApiClient.post(
            `${userType}/${userId}/payment/payment-links`,
            {
                amount: Number(body.amount),
                purpose_message: `Invoice payment`,
                expiry_time: body.expiry_time,
                customerName: body.customerName,
                customerPhone: body.customerPhone,
                accessKey: 'invoice',
                ...(body.invoiceId && body.invoiceId !== 'undefined'
                    ? { invoiceId: String(body.invoiceId) }
                    : {}),
            }
        );
        return resp;
    } catch {
        return false;
    }
};

// ─── Invoice payment history (Invoice-only Payment Section) ────────────────

export const getInvoicePaymentsApi = async (payload: UserPayload & { invoiceId: string }) => {
    try {
        const { userId, userType, invoiceId } = payload;
        const resp: SuccessGenericResponse<ManualPaymentRecord[]> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/invoicing/v2/${invoiceId}/manual-payment`
        );
        return resp.status ? resp.data : false;
    } catch {
        return false;
    }
};

// ─── Invoice payments (global, cross-invoice "Invoice Payments" tab) ───────

export const getAllManualPaymentsApi = async (
    payload: UserPayload & {
        page: number;
        itemsPerPage: number;
        searchText?: string;
        from?: string;
        to?: string;
        sort?: 'ASC' | 'DESC';
        sortField?: string;
    }
) => {
    try {
        const { userId, userType, ...params } = payload;
        const resp: SuccessGenericResponse<GetAllManualPaymentsResponse> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/invoicing/v2/manual-payments`,
            { params }
        );
        return resp.status ? resp.data : false;
    } catch {
        return false;
    }
};

export const deleteInvoicePaymentApi = async (
    payload: UserPayload & { invoiceId: string; paymentId: string | number }
) => {
    try {
        const { userId, userType, invoiceId, paymentId } = payload;
        const resp: SuccessGenericResponse<{}> = await ApiClient.delete(
            `${userType}/${userId}/officeAndBusiness/invoicing/v2/${invoiceId}/manual-payment/${paymentId}`
        );
        return resp;
    } catch {
        return false;
    }
};

export const downloadManualPaymentReceiptApi = async (
    payload: UserPayload & { invoiceId: string; paymentId: number }
) => {
    try {
        const { userId, userType, invoiceId, paymentId } = payload;
        const resp: SuccessGenericResponse<{ pdfBuffer: CommonFileBuffer; receiptNo: string }> =
            await ApiClient.post(
                `${userType}/${userId}/officeAndBusiness/invoicing/v2/${invoiceId}/manual-payment/${paymentId}/receipt/download`
            );
        return resp.status ? resp.data : false;
    } catch {
        return false;
    }
};

export const sendManualPaymentReceiptEmailApi = async (
    payload: UserPayload & { invoiceId: string; paymentId: number }
): Promise<{ success: boolean; message?: string }> => {
    try {
        const { userId, userType, invoiceId, paymentId } = payload;
        const resp: SuccessGenericResponse<{}> = await ApiClient.post(
            `${userType}/${userId}/officeAndBusiness/invoicing/v2/${invoiceId}/manual-payment/${paymentId}/receipt/email`
        );
        return { success: resp.status === true, message: resp.message };
    } catch (error: any) {
        return { success: false, message: error?.response?.data?.message };
    }
};

// NuPay invoice payment link (Collection 360). Same payload as createPaymentLinkApi but posts to the
// NuPay collect endpoint. The Decentro createPaymentLinkApi above is kept (unused) as a fallback.
export const createNupayPaymentLinkApi = async (
    payload: UserPayload & {
        amount: string;
        customerName?: string;
        customerPhone?: string;
        invoiceId?: string;
    }
) => {
    try {
        const { userId, userType, ...body } = payload;
        const resp: SuccessGenericResponse<{ paymentLink: string; expiresAt?: string }> = await ApiClient.post(
            `${userType}/${userId}/payment/payment-links/nupay/collect`,
            {
                amount: Number(body.amount),
                purpose_message: `Invoice payment`,
                customerName: body.customerName,
                customerPhone: body.customerPhone,
                accessKey: 'invoice',
                ...(body.invoiceId && body.invoiceId !== 'undefined'
                    ? { invoiceId: String(body.invoiceId) }
                    : {}),
            }
        );
        return resp;
    } catch {
        return false;
    }
};
