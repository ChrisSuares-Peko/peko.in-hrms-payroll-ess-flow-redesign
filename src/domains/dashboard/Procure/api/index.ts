import axios from 'axios';

import { SERVER_URL } from '@src/config-global';
import { ApiClient } from '@src/services/config';

import { AcknowledgePOPayload, CreateInvoicePayload, CreatePurchaseOrderPayload, CreatePurchaseRequestPayload, CreateRFQPayload, CreateVendorPayload, InvoiceData, InvoiceFilters, InvoicesResponse, PublicPOInviteData, PublicRFQInviteData, PurchaseOrderDetail, PurchaseOrderFilters, PurchaseOrdersResponse, PurchaseRequestDetail, PurchaseRequestFilters, PurchaseRequestsResponse, RFQDetail, RFQFilters, RFQsResponse, SubmitProposalPayload, UpdatePurchaseRequestPayload, UpdateRFQPayload, VendorDetail, VendorFilters, VendorsResponse,OnboardingRecord } from '../types';


// ── Onboarding ────────────────────────────────────────────────────────────────

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
export const getPublicRFQInvite = async (token: string): Promise<PublicRFQInviteData | false> => {
    try {
        const resp: any = await axios.get(`${SERVER_URL}/invite/rfq-invite/purchase/${token}`);
        return resp.data?.data;
    } catch {
        return false;
    }
};

export const submitPublicProposal = async (token: string, payload: SubmitProposalPayload): Promise<boolean> => {
    try {
        await axios.post(`${SERVER_URL}/invite/rfq-invite/purchase/${token}/submit`, payload);
        return true;
    } catch {
        return false;
    }
};

export const getPublicPOInvite = async (token: string): Promise<PublicPOInviteData | false> => {
    try {
        const resp: any = await axios.get(`${SERVER_URL}/invite/po-invite/purchase/${token}`);
        return resp.data?.data;
    } catch {
        return false;
    }
};

export const downloadPublicPOPdf = async (token: string): Promise<Blob | false> => {
    try {
        const resp: any = await axios.get(`${SERVER_URL}/invite/po-invite/purchase/pdf`, { params: { token }, responseType: 'blob' });
        return resp.data;
    } catch {
        return false;
    }
};

export const acknowledgePublicPO = async (token: string, payload: AcknowledgePOPayload): Promise<boolean> => {
    try {
        await axios.post(`${SERVER_URL}/invite/po-invite/purchase/${token}/acknowledge`, payload);
        return true;
    } catch {
        return false;
    }
};

export const getPurchaseRequests = async ({
    corporateId,
    ...params
}: { corporateId: string | number } & PurchaseRequestFilters): Promise<PurchaseRequestsResponse | false> => {
    try {
        const resp: any = await ApiClient.get(`corporate/${corporateId}/purchase/procure/purchase-requests`, { params });
        return resp.data;
    } catch {
        return false;
    }
};

export const getPurchaseRequestsDropdown = async ({
    corporateId,
    ...params
}: { corporateId: string | number } & PurchaseRequestFilters): Promise<PurchaseRequestsResponse | false> => {
    try {
        const resp: any = await ApiClient.get(`corporate/${corporateId}/purchase/procure/purchase-requests/all`, { params });
        return resp.data;
    } catch {
        return false;
    }
};

export const createPurchaseRequest = async ({
    corporateId,
    payload,
}: { corporateId: string | number; payload: CreatePurchaseRequestPayload }): Promise<{ message: string; data: PurchaseRequestDetail } | false> => {
    try {
        const resp: any = await ApiClient.post(`corporate/${corporateId}/purchase/procure/purchase-requests`, payload);
        return resp;
    } catch {
        return false;
    }
};

export const updatePurchaseRequest = async ({
    corporateId,
    id,
    payload,
}: { corporateId: string | number; id: string | number; payload: UpdatePurchaseRequestPayload }): Promise<{ message: string; data: PurchaseRequestDetail } | false> => {
    try {
        const resp: any = await ApiClient.put(`corporate/${corporateId}/purchase/procure/purchase-requests/${id}`, payload);
        return resp;
    } catch {
        return false;
    }
};

export const reopenPurchaseRequest = async ({
    corporateId,
    id,
}: { corporateId: string | number; id: string | number }): Promise<{ message: string } | false> => {
    try {
        const resp: any = await ApiClient.post(`corporate/${corporateId}/purchase/procure/purchase-requests/${id}/reopen`);
        return resp;
    } catch {
        return false;
    }
};

export const cancelPurchaseRequest = async ({
    corporateId,
    id,
}: { corporateId: string | number; id: string | number }): Promise<{ message: string } | false> => {
    try {
        const resp: any = await ApiClient.post(`corporate/${corporateId}/purchase/procure/purchase-requests/${id}/close`);
        return resp;
    } catch {
        return false;
    }
};

export const deletePurchaseRequest = async ({
    corporateId,
    id,
}: { corporateId: string | number; id: string | number }): Promise<boolean> => {
    try {
        await ApiClient.delete(`corporate/${corporateId}/purchase/procure/purchase-requests/${id}`);
        return true;
    } catch {
        return false;
    }
};

export const getPurchaseRequestById = async ({
    corporateId,
    id,
}: { corporateId: string | number; id: string | number }): Promise<PurchaseRequestDetail | false> => {
    try {
        const resp: any = await ApiClient.get(`corporate/${corporateId}/purchase/procure/purchase-requests/${id}`);
        return resp.data;
    } catch {
        return false;
    }
};

// Vendor apis

export const createVendor = async ({
    corporateId,
    ...payload
}: { corporateId: string | number } & CreateVendorPayload): Promise<{ message: string; data: any } | { error: string; responseCode: string } | false> => {
    try {
        const resp: any = await ApiClient.post(`corporate/${corporateId}/purchase/procure/vendors`, payload);
        return resp;
    } catch (err: any) {
        const data = err?.response?.data;
        return data?.message ? { error: data.message, responseCode: String(data.responseCode ?? '') } : false;
    }
};

export const getVendorById = async ({
    corporateId,
    id,
}: { corporateId: string | number; id: string | number }): Promise<VendorDetail | false> => {
    try {
        const resp: any = await ApiClient.get(`corporate/${corporateId}/purchase/procure/vendors/${id}`);
        return resp.data;
    } catch {
        return false;
    }
};



export const getVendors = async ({
    corporateId,
    ...params
}: { corporateId: string | number } & VendorFilters): Promise<VendorsResponse | false> => {
    try {
        const resp: any = await ApiClient.get(`corporate/${corporateId}/purchase/procure/vendors`, { params });
        return resp.data;
    } catch {
        return false;
    }
};

export const getVendorsWithoutPagination = async ({
    corporateId,
}: { corporateId: string | number }): Promise<VendorDetail[] | false> => {
    try {
        const resp: any = await ApiClient.get(`corporate/${corporateId}/purchase/procure/vendors/all`);
        return resp.data;
    } catch {
        return false;
    }
};
export const updateVendor = async ({
    corporateId,
    id,
    ...payload
}: { corporateId: string | number; id: string | number } & CreateVendorPayload): Promise<{ message: string; data: any } | { error: string; responseCode: string } | false> => {
    try {
        const resp: any = await ApiClient.put(`corporate/${corporateId}/purchase/procure/vendors/${id}`, payload);
        return resp;
    } catch (err: any) {
        const data = err?.response?.data;
        return data?.message ? { error: data.message, responseCode: String(data.responseCode ?? '') } : false;
    }
};

export const deleteVendor = async ({
    corporateId,
    id,
}: { corporateId: string | number; id: string | number }): Promise<boolean> => {
    try {
        await ApiClient.delete(`corporate/${corporateId}/purchase/procure/vendors/${id}`);
        return true;
    } catch {
        return false;
    }
};

export const importVendorsCSV = async ({
    corporateId,
    file,
}: { corporateId: string | number; file: File }): Promise<{ message: string; data: any } | false> => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        const resp: any = await ApiClient.post(
            `corporate/${corporateId}/purchase/procure/vendors/import-csv`,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        return resp;
    } catch {
        return false;
    }
};

export const getEmployee= async ({
    corporateId,
}: { corporateId: string | number }): Promise<any | false> => {
    try {
        const resp: any = await ApiClient.get(`corporate/${corporateId}/purchase/procure/purchase-requests/employees`);
        return resp.data;
    } catch {
        return false;
    }
};

export const addEmployee = async ({
    corporateId,
    payload,
}: { corporateId: string | number; payload: any }): Promise<{ message: string; data: any } | false> => {
    try {
        const resp: any = await ApiClient.post(`corporate/${corporateId}/purchase/procure/purchase-requests/employees`, payload);
        return resp;
    } catch {
        return false;
    }
};
// RFQ apis


export const sendReminders = async ({
    corporateId,
    id,
    invitedEmails,
}: { corporateId: string | number; id: string | number; invitedEmails?: string[] }): Promise<{ message: string } | false> => {
    try {
        const resp: any = await ApiClient.post(`corporate/${corporateId}/purchase/procure/rfqs/${id}/send-reminder`, { invitedEmails });
        return resp;
    } catch {
        return false;
    }
};

export const getRFQsAll = async ({
    corporateId,
}: { corporateId: string | number }): Promise<RFQDetail[] | false> => {
    try {
        const resp: any = await ApiClient.get(`corporate/${corporateId}/purchase/procure/rfqs/all`);
        return resp.data;
    } catch {
        return false;
    }
};

export const getRFQs = async ({
    corporateId,
    ...params
}: { corporateId: string | number } & RFQFilters): Promise<RFQsResponse | false> => {
    try {
        const resp: any = await ApiClient.get(`corporate/${corporateId}/purchase/procure/rfqs`, { params });
        return resp.data;
    } catch {
        return false;
    }
};

export const getRFQById = async ({
    corporateId,
    id,
}: { corporateId: string | number; id: string | number }): Promise<RFQDetail | false> => {
    try {
        const resp: any = await ApiClient.get(`corporate/${corporateId}/purchase/procure/rfqs/${id}`);
        return resp.data;
    } catch {
        return false;
    }
};

export type VendorEmailError = { vendorsWithoutEmail: { id: number; businessName: string }[] };

export const createRFQ = async ({
    corporateId,
    payload,
}: { corporateId: string | number; payload: CreateRFQPayload }): Promise<{ message: string; data: RFQDetail } | { vendorEmailError: VendorEmailError } | false> => {
    try {
        const resp: any = await ApiClient.post(`corporate/${corporateId}/purchase/procure/rfqs`, payload);
        return resp;
    } catch (err: any) {
        const data = err?.response?.data;
        if (data?.responseCode === '003' && data?.data?.vendorsWithoutEmail) {
            return { vendorEmailError: data.data };
        }
        return false;
    }
};

export const saveDraftRFQ = async ({
    corporateId,
    payload,
}: { corporateId: string | number; payload: Partial<Omit<CreateRFQPayload, 'send'>> }): Promise<{ message: string; data: RFQDetail } | false> => {
    try {
        const resp: any = await ApiClient.post(`corporate/${corporateId}/purchase/procure/rfqs/draft`, payload);
        return resp;
    } catch {
        return false;
    }
};

export const saveExistingDraftRFQ = async ({
    corporateId,
    id,
    payload,
}: { corporateId: string | number; id: string | number; payload: Partial<UpdateRFQPayload> }): Promise<{ message: string; data: RFQDetail } | false> => {
    try {
        const resp: any = await ApiClient.patch(`corporate/${corporateId}/purchase/procure/rfqs/${id}/draft`, payload);
        return resp;
    } catch {
        return false;
    }
};

export const updateRFQ = async ({
    corporateId,
    id,
    payload,
}: { corporateId: string | number; id: string | number; payload: UpdateRFQPayload }): Promise<{ message: string; data: RFQDetail } | { vendorEmailError: VendorEmailError } | false> => {
    try {
        const resp: any = await ApiClient.put(`corporate/${corporateId}/purchase/procure/rfqs/${id}`, payload);
        return resp;
    } catch (err: any) {
        const data = err?.response?.data;
        if (data?.responseCode === '003' && data?.data?.vendorsWithoutEmail) {
            return { vendorEmailError: data.data };
        }
        return false;
    }
};

export const deleteRFQAttachment = async ({
    corporateId,
    id,
    fileName,
}: { corporateId: string | number; id: string | number; fileName: string }): Promise<{ message: string; data: { attachments: any[] } } | false> => {
    try {
        const resp: any = await ApiClient.delete(`corporate/${corporateId}/purchase/procure/rfqs/${id}/attachments`, { data: { fileName } });
        return resp;
    } catch {
        return false;
    }
};

export const closeRFQ = async ({
    corporateId,
    id,
}: { corporateId: string | number; id: string | number }): Promise<{ message: string; data: RFQDetail } | false> => {
    try {
        const resp: any = await ApiClient.post(`corporate/${corporateId}/purchase/procure/rfqs/${id}/close`);
        return resp;
    } catch {
        return false;
    }
};

export const reopenRFQ = async ({
    corporateId,
    id,
}: { corporateId: string | number; id: string | number }): Promise<{ message: string; data: RFQDetail } | false> => {
    try {
        const resp: any = await ApiClient.post(`corporate/${corporateId}/purchase/procure/rfqs/${id}/reopen`);
        return resp;
    } catch {
        return false;
    }
};

// PO apis
export const getPurchaseOrders = async ({
    corporateId,
    ...params
}: { corporateId: string | number } & PurchaseOrderFilters): Promise<PurchaseOrdersResponse | false> => {
    try {
        const resp: any = await ApiClient.get(`corporate/${corporateId}/purchase/procure/purchase-orders`, { params });
        return resp.data;
    } catch {
        return false;
    }
};

export const getPurchaseOrdersDropdown = async ({
    corporateId,
    ...params
}: { corporateId: string | number } & PurchaseOrderFilters): Promise<PurchaseOrdersResponse | false> => {
    try {
        const resp: any = await ApiClient.get(`corporate/${corporateId}/purchase/procure/purchase-orders/all`, { params });
        return resp.data;
    } catch {
        return false;
    }
};
export const getPurchaseOrderById = async ({
    corporateId,
    id,
}: { corporateId: string | number; id: string | number }): Promise<PurchaseOrderDetail | false> => {
    try {
        const resp: any = await ApiClient.get(`corporate/${corporateId}/purchase/procure/purchase-orders/${id}`);
        return resp.data;
    } catch {
        return false;
    }
};


export const getPurchaseOrderDocument = async ({
    corporateId,
    id,
}: { corporateId: string | number; id: string | number }): Promise<any | false> => {
    try {
        const resp: any = await ApiClient.get(
            `corporate/${corporateId}/purchase/procure/purchase-orders/${id}/document`
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const getPurchaseOrderPdf = async ({
    corporateId,
    id,
}: { corporateId: string | number; id: string | number }): Promise<Blob | false> => {
    try {
        const resp: any = await ApiClient.get(
            `corporate/${corporateId}/purchase/procure/purchase-orders/${id}/pdf`,
            { responseType: 'blob' }
        );
        return resp;
    } catch {
        return false;
    }
};

export const updatePurchaseOrderStatus = async ({
    corporateId,
    id,
    nextStatus,
}: { corporateId: string | number; id: string | number; nextStatus: string }): Promise<{ message: string; data: PurchaseOrderDetail } | { vendorEmailError: VendorEmailError } | false> => {

    if (!nextStatus) return false;
    try {
        const resp: any = await ApiClient.post(`corporate/${corporateId}/purchase/procure/purchase-orders/${id}/${nextStatus}`);
        return resp;
    } catch (err: any) {
        const data = err?.response?.data;
        if (data?.responseCode === '003' && data?.data?.vendorsWithoutEmail) {
            return { vendorEmailError: data.data };
        }
        return false;
    }
};

export const getPurchaseOrderJourney = async ({
    corporateId,
    id,
}: { corporateId: string | number; id: string | number }): Promise<any[] | false> => {
    try {
        const resp: any = await ApiClient.get(
            `corporate/${corporateId}/purchase/procure/purchase-orders/${id}/journey`
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const getPurchaseOrderNotes = async ({
    corporateId,
    id,
}: { corporateId: string | number; id: string | number }): Promise<any[] | false> => {
    try {
        const resp: any = await ApiClient.get(
            `corporate/${corporateId}/purchase/procure/purchase-orders/${id}/notes`
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const addPurchaseOrderNote = async ({
    corporateId,
    id,
    note,
}: { corporateId: string | number; id: string | number; note: string }): Promise<{ message: string; data: any } | false> => {
    try {
        const resp: any = await ApiClient.post(
            `corporate/${corporateId}/purchase/procure/purchase-orders/${id}/notes`,
            { note }
        );
        return resp;
    } catch {
        return false;
    }
};

export const createPurchaseOrder = async ({
    corporateId,
    payload,
}: { corporateId: string | number; payload: CreatePurchaseOrderPayload }): Promise<{ message: string; data: PurchaseOrderDetail } | false> => {
    try {
        const resp: any = await ApiClient.post(`corporate/${corporateId}/purchase/procure/purchase-orders`, payload);
        return resp;
    } catch {
        return false;
    }
}

export const updatePurchaseOrder = async ({
    corporateId,
    id,
    payload,
}: { corporateId: string | number; id: string | number; payload: any }): Promise<{ message: string; data: any } | false> => {
    try {
        const resp: any = await ApiClient.put(`corporate/${corporateId}/purchase/procure/purchase-orders/${id}`, payload);
        return resp;
    } catch {
        return false;
    }
};

export const cancelPurchaseOrder = async ({
    corporateId,
    id,
    reason,
}: { corporateId: string | number; id: string | number; reason: string }): Promise<{ message: string; data: PurchaseOrderDetail } | false> => {
    try {
        const resp: any = await ApiClient.post(`corporate/${corporateId}/purchase/procure/purchase-orders/${id}/cancel`, { reason });
        return resp;
    } catch {
        return false;
    }
};

export const deletePurchaseOrder = async ({
    corporateId,
    id,
}: { corporateId: string | number; id: string | number }): Promise<boolean> => {
    try {
        await ApiClient.delete(`corporate/${corporateId}/purchase/procure/purchase-orders/${id}`);
        return true;
    } catch {
        return false;
    }
};

// proposal apis

export const getAllProposals = async ({
    corporateId,
    ...params
}: { corporateId: string | number } & any): Promise<any | false> => {
    try {
        const resp: any = await ApiClient.get(`corporate/${corporateId}/purchase/procure/proposals/all`, { params });
        return resp.data;
    } catch {
        return false;
    }
};

export const getProposals = async ({
    corporateId,
    rfqId,
    ...params
}: { corporateId: string | number; rfqId: string | number } & any): Promise<any | false> => {
    const cleanParams = Object.fromEntries(
        Object.entries({ rfqId, ...params }).filter(([, v]) => v !== undefined && v !== null && v !== '')
    );
    try {
        const resp: any = await ApiClient.get(`corporate/${corporateId}/purchase/procure/proposals`, { params: cleanParams });
        return resp.data;
    } catch {
        return false;
    }
};

export const getProposalById = async ({
    corporateId,
    id,
    rfqId,
}: { corporateId: string | number; id: string | number; rfqId?: string | number }): Promise<any | false> => {
    try {
        const resp: any = await ApiClient.get(`corporate/${corporateId}/purchase/procure/proposals/${id}`, {
            params: rfqId ? { rfqId } : undefined,
        });
        return resp.data;
    } catch {
        return false;
    }
};

export const acceptProposal = async ({
    corporateId,
    id,
    rfqId,
}: { corporateId: string | number; id: string | number; rfqId: string | number }): Promise<{ message: string; data: any } | false> => {
    try {
        const resp: any = await ApiClient.post(`corporate/${corporateId}/purchase/procure/proposals/${id}/accept`, null, { params: { rfqId } });
        return resp;
    } catch {
        return false;
    }
};

export const declineProposal = async ({
    corporateId,
    id,
    rfqId,
}: { corporateId: string | number; id: string | number; rfqId: string | number }): Promise<{ message: string; data: any } | false> => {
    try {
        const resp: any = await ApiClient.post(`corporate/${corporateId}/purchase/procure/proposals/${id}/decline`, null, { params: { rfqId } });
        return resp;
    } catch {
        return false;
    }
};


export const undoDeclineProposal = async ({
    corporateId,
    id,
    rfqId,
}: { corporateId: string | number; id: string | number; rfqId: string | number }): Promise<{ message: string; data: any } | false> => {
    try {
        const resp: any = await ApiClient.post(`corporate/${corporateId}/purchase/procure/proposals/${id}/undo-decline`, null, { params: { rfqId } });
        return resp;
    } catch {
        return false;
    }
};
export const undoAcceptProposal = async ({
    corporateId,
    id,
    rfqId,
}: { corporateId: string | number; id: string | number; rfqId: string | number }): Promise<{ message: string; data: any } | false> => {
    try {
        const resp: any = await ApiClient.post(`corporate/${corporateId}/purchase/procure/proposals/${id}/undo-accept`, null, { params: { rfqId } });
        return resp;
    } catch {
        return false;
    }
};

export const createProposal = async ({    corporateId,
    payload,   }: { corporateId: string | number; payload: any }): Promise<{ message: string; data: any } | false> => {
    try {       
        const resp: any = await ApiClient.post(`corporate/${corporateId}/purchase/procure/proposals`, payload);
        return resp;
    }   catch {                             
        return false;
    }
};

export const getPurchaseOrdersAll = async ({
    corporateId,
}: { corporateId: string | number }): Promise<PurchaseOrderDetail[] | false> => {
    try {
        const resp: any = await ApiClient.get(`corporate/${corporateId}/purchase/procure/purchase-orders/all`);
        return resp.data;
    } catch {
        return false;
    }
};

// invoice api

export const getInvoices = async ({
    corporateId,
    ...params
}: { corporateId: string | number } & InvoiceFilters): Promise<InvoicesResponse | false> => {
    try {
        const resp: any = await ApiClient.get(`corporate/${corporateId}/purchase/procure/invoices`, { params });
        return resp;
    } catch {
        return false;
    }
};

export const createInvoice = async ({
    corporateId,
    payload,
}: { corporateId: string | number; payload: CreateInvoicePayload }): Promise<{ message: string; data: InvoiceData } | false> => {
    try {
        const resp: any = await ApiClient.post(`corporate/${corporateId}/purchase/procure/invoices`, payload);
        return resp;
    } catch {
        return false;
    }
};

export const getInvoiceById = async ({
    corporateId,
    id,     }: { corporateId: string | number; id: string | number }): Promise<InvoiceData | false> => {
    try {
        const resp: any = await ApiClient.get(`corporate/${corporateId}/purchase/procure/invoices/${id}`);    
        return resp.data;
    } catch {
        return false;
    }
};

export const updateInvoice = async ({
    corporateId,
    id,
    payload,
}: { corporateId: string | number; id: string | number; payload: Partial<CreateInvoicePayload> }): Promise<{ message: string; data: InvoiceData } | false> => {
    try {
        const resp: any = await ApiClient.put(`corporate/${corporateId}/purchase/procure/invoices/${id}`, payload);
        return resp;
    } catch {
        return false;
    }
};

export const createPaymentForInvoice = async ({
    corporateId,
    id,
    transferType = 'NEFT',
    virtualAccountNumber,
}: { corporateId: string | number; id: string | number; transferType?: string; virtualAccountNumber?: string | null }): Promise<{ message: string; data: any } | false> => {
    try {
        const resp: any = await ApiClient.post(`corporate/${corporateId}/purchase/procure/invoices/${id}/pay`, { transferType, virtualAccountNumber });
        return resp;
    } catch {
        return false;
    }
};

// api for dashboard
export const getDashboardData = async ({
    corporateId,
}: { corporateId: string | number }): Promise<any | false> => {     
    try {
        const resp: any = await ApiClient.get(`corporate/${corporateId}/purchase/procure/dashboard`);    
        return resp.data;
    } catch {
        
        return false;
    }   
};

export const getDashboardChartData = async ({
    corporateId,
}: { corporateId: string | number }): Promise<any | false> => {
    try {
        const resp: any = await ApiClient.get(`corporate/${corporateId}/purchase/procure/dashboard/charts`);
        return resp.data;
    } catch {
        return false;
    }
};

export interface ActivityFilters {
    search?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
}

export const getActivityData = async ({
    corporateId,
    ...params
}: { corporateId: string | number } & ActivityFilters): Promise<{ data: import('../types').DashboardActivity[]; total: number; page: number; limit: number } | false> => {
    try {
        const cleanParams = Object.fromEntries(
            Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
        );
        const resp: any = await ApiClient.get(
            `corporate/${corporateId}/purchase/procure/dashboard/activity`,
            { params: cleanParams }
        );
        return resp.data;
    } catch {
        return false;
    }
};

