import { CommonFileBuffer, SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { CreateInvoicePayload, CustomerOption } from '../types/createInvoice';
import { CreateCreditNotePayload, CreditNoteDashboard } from '../types/creditNote';
import { DashboardStats } from '../types/dashboard';
import {
    GetAllInvoicesPayload,
    GetAllInvoicesResponse,
    GetInvoiceByIdResponse,
} from '../types/invoice';
import { GetAllPaymentsReceivedResponse } from '../types/paymentsReceived';

export interface ManualPaymentRecord {
    id: number;
    invoiceId: number;
    amount: string;
    originalAmount?: string;
    paymentMethod: string;
    paymentDate: string;
    referenceId?: string | null;
    notes?: string | null;
    isDeleted: boolean;
    receiptNo?: string | null;
    createdAt?: string;
}

export const getAllCustomersForSelect = async (payload: UserPayload) => {
    try {
        const { userId, userType } = payload;
        const resp: SuccessGenericResponse<CustomerOption[]> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/invoicing/v2/customers`
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const getAllInvoices = async (payload: UserPayload & GetAllInvoicesPayload) => {
    try {
        const { userId, userType, endDate, startDate, ...rest } = payload;
        const resp: SuccessGenericResponse<GetAllInvoicesResponse> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/invoicing/v2/all`,
            {
                params: {
                    ...rest,
                    to: endDate,
                    from: startDate,
                },
            }
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const getInvoiceById = async (payload: UserPayload & { invoiceId: string }) => {
    try {
        const { userId, userType, invoiceId } = payload;
        const resp: SuccessGenericResponse<GetInvoiceByIdResponse> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/invoicing/v2/${invoiceId}`
        );
        return resp.status ? resp.data : false;
    } catch {
        return false;
    }
};

export const updateInvoice = async (payload: CreateInvoicePayload & { invoiceId: string }) => {
    try {
        const { userId, userType, invoiceId, ...restPayload } = payload;
        const resp: SuccessGenericResponse<{ id: string }> = await ApiClient.put(
            `${userType}/${userId}/officeAndBusiness/invoicing/v2/${invoiceId}`,
            restPayload
        );
        return resp;
    } catch {
        return false;
    }
};

export const downloadInvoicePdfApi = async (
    payload: UserPayload & { invoiceId: string; type?: string }
) => {
    try {
        const { userId, userType, invoiceId, type } = payload;
        const resp: SuccessGenericResponse<CommonFileBuffer> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/invoicing/v2/downloadInvoice/${invoiceId}`,
            { params: type ? { type } : undefined }
        );
        return resp;
    } catch {
        return false;
    }
};

export const downloadCreditNotePdfApi = async (payload: UserPayload & { invoiceId: string }) => {
    try {
        const { userId, userType, invoiceId } = payload;
        const resp: SuccessGenericResponse<CommonFileBuffer> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/invoicing/v2/credit-notes/download/${invoiceId}`,
            { params: { type: 'download' } }
        );
        return resp;
    } catch {
        return false;
    }
};

export const deleteInvoiceApi = async (payload: UserPayload & { invoiceId: string }) => {
    try {
        const { userId, userType, invoiceId } = payload;
        const resp: SuccessGenericResponse<{}> = await ApiClient.delete(
            `${userType}/${userId}/officeAndBusiness/invoicing/v2/${invoiceId}`
        );
        return resp;
    } catch {
        return false;
    }
};

export const createInvoice = async (payload: CreateInvoicePayload) => {
    try {
        const { userId, userType, ...restPayload } = payload;
        const resp: SuccessGenericResponse<{ id: string }> = await ApiClient.post(
            `${userType}/${userId}/officeAndBusiness/invoicing/v2`,
            restPayload
        );
        return resp;
    } catch (err) {
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

export const updateCreditNoteStatusApi = async (
    payload: UserPayload & { invoiceId: string; status: 'PENDING' | 'REFUNDED' }
) => {
    try {
        const { userId, userType, invoiceId, status } = payload;
        const resp: SuccessGenericResponse<{}> = await ApiClient.patch(
            `${userType}/${userId}/officeAndBusiness/invoicing/v2/${invoiceId}/credit-note-status`,
            { status }
        );
        return resp;
    } catch {
        return false;
    }
};

export const getAllPaymentsReceivedApi = async (
    payload: UserPayload & {
        page?: number;
        itemsPerPage?: number;
        mode?: string;
        customerName?: string;
        startDate?: string;
        endDate?: string;
    }
) => {
    try {
        const { userId, userType, startDate, endDate, ...rest } = payload;
        const resp: SuccessGenericResponse<GetAllPaymentsReceivedResponse> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/invoicing/v2/receipts`,
            {
                params: {
                    ...rest,
                    from: startDate,
                    to: endDate,
                },
            }
        );
        return resp.status ? resp.data : false;
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

export const getNextInvoiceNumberApi = async (payload: UserPayload) => {
    try {
        const { userId, userType } = payload;
        const resp: SuccessGenericResponse<{ nextNumber: string }> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/invoicing/v2/next-number`
        );
        return resp.status ? resp.data : false;
    } catch {
        return false;
    }
};

// ─── Credit Note APIs ────────────────────────────────────────────────────────

export const getAllCreditNotesApi = async (
    payload: UserPayload & {
        page?: number;
        itemsPerPage?: number;
        searchText?: string;
        startDate?: string;
        endDate?: string;
        status?: string;
        linkedInvoiceId?: string | number;
    }
) => {
    const result = await getAllInvoices({ ...payload, documentType: 'CREDIT_NOTE' } as any);
    if (!result) return false;
    return {
        creditNotes: result.invoiceData.map((inv: any) => {
            const details = inv.creditNoteDetails || {};
            return {
                id: inv.id,
                creditNoteNumber: inv.invoiceNumber,
                prefix: inv.prefix,
                linkedInvoiceId: inv.linkedInvoiceId,
                linkedInvoiceNumber: details.linkedInvoiceNumber || null,
                linkedInvoicePrefix: details.linkedInvoicePrefix || null,
                reason: details.reason || null,
                reasonDetail: details.additionalDetails || null,
                customerName: inv.name,
                customerEmail: inv.email,
                status: inv.status,
                currency: inv.currency || 'INR',
                totalAmount: inv.totalAmount,
                amountDue: inv.amountDue,
                issueDate: inv.invoiceDate,
                dueDate: inv.dueDate,
                createdAt: inv.createdAt,
                items: inv.items,
            };
        }),
        recordsTotal: result.recordsTotal,
    };
};

export const getCreditNoteDashboardApi = async (payload: UserPayload) => {
    try {
        const { userId, userType } = payload;
        const resp: SuccessGenericResponse<CreditNoteDashboard> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/invoicing/v2/credit-notes/dashboard`
        );
        return resp.status ? resp.data : false;
    } catch {
        return false;
    }
};

export const getCreditNoteByIdApi = async (payload: UserPayload & { creditNoteId: string }) =>
    getInvoiceById({ ...payload, invoiceId: payload.creditNoteId });

export const getNextCreditNoteNumberApi = async (payload: UserPayload) => {
    try {
        const { userId, userType } = payload;
        const resp: SuccessGenericResponse<{ nextNumber: string; prefix: string }> =
            await ApiClient.get(
                `${userType}/${userId}/officeAndBusiness/invoicing/v2/credit-notes/next-number`
            );
        return resp.status ? resp.data : false;
    } catch {
        return false;
    }
};

export const createCreditNoteApi = async (payload: UserPayload & CreateCreditNotePayload) => {
    try {
        const { userId, userType, ...body } = payload;
        const resp: SuccessGenericResponse<{ id: string; invoiceNumber: string }> =
            await ApiClient.post(
                `${userType}/${userId}/officeAndBusiness/invoicing/v2/credit-notes`,
                body
            );
        return resp;
    } catch {
        return false;
    }
};

export const sendInvoiceEmailApi = async (
    payload: UserPayload & { invoiceId: string; email?: string }
) => {
    try {
        const { userId, userType, invoiceId, email } = payload;
        const resp: SuccessGenericResponse<{}> = await ApiClient.post(
            `${userType}/${userId}/officeAndBusiness/invoicing/v2/${invoiceId}/send-email`,
            email ? { email } : undefined
        );
        return resp;
    } catch {
        return false;
    }
};

export const getQuotationDashboardApi = async (payload: UserPayload) => {
    try {
        const { userId, userType } = payload;
        const resp: SuccessGenericResponse<{
            totalQuotations: number;
            accepted: number;
            pending: number;
        }> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/invoicing/v2/quotation/dashboard`
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const getDashboardStats = async (payload: UserPayload) => {
    try {
        const { userId, userType } = payload;
        const resp: SuccessGenericResponse<DashboardStats> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/invoicing/v2/dashboard`
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
                invoiceId: String(body.invoiceId),
            }
        );
        return resp;
    } catch {
        return false;
    }
};

export const markInvoiceAsPaid = async (
    payload: UserPayload & { invoiceId: string }
): Promise<boolean> => {
    try {
        const { userId, userType, invoiceId } = payload;
        await ApiClient.patch(
            `${userType}/${userId}/officeAndBusiness/invoicing/v2/${invoiceId}/status`,
            { status: 'PAID' }
        );
        return true;
    } catch {
        return false;
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
        const resp: SuccessGenericResponse<{ paymentLink: string; expiresAt?: string }> =
            await ApiClient.post(`${userType}/${userId}/payment/payment-links/nupay/collect`, {
                amount: Number(body.amount),
                purpose_message: `Invoice payment`,
                customerName: body.customerName,
                customerPhone: body.customerPhone,
                accessKey: 'invoice',
                invoiceId: String(body.invoiceId),
            });
        return resp;
    } catch {
        return false;
    }
};
