import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    AddedBackLiabilitiesResponse,
    AddGstr1DocumentPayload,
    AddGstr1HsnPayload,
    AmendmentPayload,
    CashItcBalanceData,
    CashLedgerData,
    Gstr9DraftData,
    Gstr9SavePayload,
    Gstr9Section8AData,
    ItcLedgerData,
    ReturnLiabilityData,
    DocumentRow,
    GstSetup,
    GstSetupPayload,
    Gstr1MonthStatus,
    Gstr1PortalSummary,
    Gstr1Summary,
    Gstr2bApiResponse,
    HsnSummaryRow,
    ImsHistoryEntry,
    ImsSupplierResponse,
    ItcEstimate,
    ImsDataResponse,
    KycBusiness,
    SalesInvoicesResponse,
    TaxOverviewData,
    GstinSearchResult,
    SubmitImsPayload,
    AddSalesInvoicesPayload,
    UpdateSalesInvoicePayload,
    AddCustomerPayload,
    AddVendorPayload,
    PanSearchResponse,
    FilingHistoryEntry,
} from '../types';

const BASE = (userType: string, userId: number) => `${userType}/${userId}/officeAndBusiness/tax`;

// ─── Overview ─────────────────────────────────────────────────────────────────

export const getTaxOverview = async (payload: UserPayload) => {
    try {
        const { userId, userType } = payload;
        const resp: SuccessGenericResponse<TaxOverviewData> = await ApiClient.get(
            `${BASE(userType, userId)}/overview`
        );
        return resp.data;
    } catch {
        return false;
    }
};

// ─── GST Setup ────────────────────────────────────────────────────────────────

export const getGstSetups = async (payload: UserPayload) => {
    try {
        const { userId, userType } = payload;
        const resp: SuccessGenericResponse<GstSetup[]> = await ApiClient.get(
            `${BASE(userType, userId)}/gst/setup`
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const createGstSetup = async (payload: UserPayload & GstSetupPayload) => {
    try {
        const { userId, userType, ...body } = payload;
        const resp: SuccessGenericResponse<GstSetup> = await ApiClient.post(
            `${BASE(userType, userId)}/gst/setup`,
            body
        );
        return resp;
    } catch {
        return false;
    }
};

// ─── Sales Invoices ───────────────────────────────────────────────────────────

export const getSalesInvoices = async (
    payload: UserPayload & { gstin: string; financialYear: string; month?: number }
) => {
    try {
        const { userId, userType, ...params } = payload;
        const resp: SuccessGenericResponse<SalesInvoicesResponse> = await ApiClient.get(
            `${BASE(userType, userId)}/gst/sales-invoices`,
            { params }
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const addSalesInvoices = async (payload: UserPayload & AddSalesInvoicesPayload) => {
    try {
        const { userId, userType, ...body } = payload;
        const resp: SuccessGenericResponse<{ count: number }> = await ApiClient.post(
            `${BASE(userType, userId)}/gst/sales-invoices`,
            body
        );
        return resp;
    } catch {
        return false;
    }
};

export const updateSalesInvoice = async (
    payload: UserPayload & UpdateSalesInvoicePayload & { id: string }
) => {
    try {
        const { userId, userType, id, ...body } = payload;
        const resp: SuccessGenericResponse<{}> = await ApiClient.put(
            `${BASE(userType, userId)}/gst/sales-invoices/${id}`,
            body
        );
        return resp;
    } catch {
        return false;
    }
};

export const syncSalesInvoicesFromPeko = async (
    payload: UserPayload & { gstin: string; financialYear: string; month: number }
) => {
    try {
        const { userId, userType, ...body } = payload;
        const resp: SuccessGenericResponse<{ synced: number; skipped: number }> =
            await ApiClient.post(
                `${BASE(userType, userId)}/gst/sales-invoices/sync-from-peko`,
                body
            );
        return resp;
    } catch {
        return false;
    }
};

export const deleteSalesInvoice = async (payload: UserPayload & { id: string }) => {
    try {
        const { userId, userType, id } = payload;
        const resp: SuccessGenericResponse<{}> = await ApiClient.delete(
            `${BASE(userType, userId)}/gst/sales-invoices/${id}`
        );
        return resp;
    } catch {
        return false;
    }
};

// ─── IMS / GSTR-2A Reconciliation ────────────────────────────────────────────

export const submitImsReconciliation = async (payload: UserPayload & SubmitImsPayload) => {
    try {
        const { userId, userType, ...body } = payload;
        const resp: SuccessGenericResponse<{
            reconciliationId: number;
            sandboxJobId: string;
            gstr2aUploadUrl: string;
            purchaseLedgerUploadUrl: string;
            status: string;
        }> = await ApiClient.post(`${BASE(userType, userId)}/gst/ims/reconcile`, body);
        return resp;
    } catch {
        return false;
    }
};

export const getImsData = async (payload: UserPayload & { reconciliationId: string }) => {
    try {
        const { userId, userType, reconciliationId } = payload;
        const resp: SuccessGenericResponse<ImsDataResponse> = await ApiClient.get(
            `${BASE(userType, userId)}/gst/ims/${reconciliationId}`
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const getImsList = async (
    payload: UserPayload & {
        gstin: string;
        financialYear: string;
        month: number;
        tab?: string;
        actionFilter?: string;
        page?: number;
        limit?: number;
        search?: string;
    }
) => {
    try {
        const { userId, userType, ...params } = payload;
        const p = params as Record<string, unknown>;
        if (!params.search) delete p.search;
        if (!params.tab || params.tab === 'all') delete p.tab;
        if (!params.actionFilter) delete p.actionFilter;
        const resp: SuccessGenericResponse<ImsDataResponse> = await ApiClient.get(
            `${BASE(userType, userId)}/gst/ims`,
            { params }
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const updateImsInvoiceAction = async (
    payload: UserPayload & { id: string; imsAction: 'accepted' | 'rejected' | 'pending' }
) => {
    try {
        const { userId, userType, id, imsAction } = payload;
        const resp: SuccessGenericResponse<{}> = await ApiClient.put(
            `${BASE(userType, userId)}/gst/ims/invoice/${id}`,
            { imsAction }
        );
        return resp;
    } catch {
        return false;
    }
};

export const resetImsInvoice = async (
    payload: UserPayload & {
        gstin: string;
        financialYear: string;
        month: number;
        invoiceIds: number[];
    }
) => {
    try {
        const { userId, userType, ...body } = payload;
        const resp: SuccessGenericResponse<{}> = await ApiClient.post(
            `${BASE(userType, userId)}/gst/ims/reset`,
            body
        );
        return resp;
    } catch {
        return false;
    }
};

export const getImsSaveHistory = async (
    payload: UserPayload & { gstin: string; financialYear: string; month: number }
) => {
    try {
        const { userId, userType, ...params } = payload;
        const resp: SuccessGenericResponse<ImsHistoryEntry[]> = await ApiClient.get(
            `${BASE(userType, userId)}/gst/ims/saves`,
            { params }
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const saveIms = async (
    payload: UserPayload & { gstin: string; financialYear: string; month: number }
) => {
    try {
        const { userId, userType, ...body } = payload;
        const resp: SuccessGenericResponse<{}> = await ApiClient.post(
            `${BASE(userType, userId)}/gst/ims/save`,
            body
        );
        return resp;
    } catch {
        return false;
    }
};

export const proceedIms = async (
    payload: UserPayload & { gstin: string; financialYear: string; month: number }
) => {
    try {
        const { userId, userType, ...body } = payload;
        const resp: SuccessGenericResponse<{ itcEstimate: ItcEstimate }> = await ApiClient.post(
            `${BASE(userType, userId)}/gst/ims/proceed`,
            body
        );
        return resp;
    } catch {
        return false;
    }
};

export const getImsSupplierInvoices = async (
    payload: UserPayload & { gstin: string; financialYear: string; month: number }
) => {
    try {
        const { userId, userType, ...params } = payload;
        const resp: SuccessGenericResponse<ImsSupplierResponse> = await ApiClient.get(
            `${BASE(userType, userId)}/gst/ims/supplier`,
            { params }
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const getAddedBackLiabilities = async (
    payload: UserPayload & { gstin: string; financialYear: string; month: number }
) => {
    try {
        const { userId, userType, ...params } = payload;
        const resp: SuccessGenericResponse<AddedBackLiabilitiesResponse> = await ApiClient.get(
            `${BASE(userType, userId)}/gst/ims/added-back`,
            { params }
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const getItcEstimate = async (payload: UserPayload & { reconciliationId: string }) => {
    try {
        const { userId, userType, reconciliationId } = payload;
        const resp: SuccessGenericResponse<ItcEstimate> = await ApiClient.get(
            `${BASE(userType, userId)}/gst/ims/${reconciliationId}/itc`
        );
        return resp.data;
    } catch {
        return false;
    }
};

// ─── KYC ──────────────────────────────────────────────────────────────────────

export const getGstStatesApi = async () => {
    try {
        const resp: SuccessGenericResponse<{ states: { label: string; value: string }[] }> =
            await ApiClient.get('user/general/gst-states');
        return resp.data?.states ?? [];
    } catch {
        return [];
    }
};

export const verifyPanKyc = async (
    payload: UserPayload & { pan: string; fullName?: string; dob?: string; stateCode: string }
) => {
    try {
        const { userId, userType, pan, fullName, dob, stateCode } = payload;
        const resp: SuccessGenericResponse<{
            pan: string;
            fullName: string | null;
            dob: string | null;
            businesses: KycBusiness[];
        }> = await ApiClient.post(`${BASE(userType, userId)}/kyc/verify-pan`, {
            pan,
            fullName,
            dob, stateCode,
        });
        return resp;
    } catch {
        return false;
    }
};

// ─── GSTR-1 Filing ────────────────────────────────────────────────────────────

export const getGstr1Months = async (
    payload: UserPayload & { gstin: string; financialYear: string }
) => {
    try {
        const { userId, userType, ...params } = payload;
        const resp: SuccessGenericResponse<Gstr1MonthStatus[]> = await ApiClient.get(
            `${BASE(userType, userId)}/gst/gstr1/months`,
            { params }
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const getGstr1Summary = async (
    payload: UserPayload & { gstin: string; financialYear: string; month: number }
) => {
    try {
        const { userId, userType, ...params } = payload;
        const resp: SuccessGenericResponse<Gstr1Summary> = await ApiClient.get(
            `${BASE(userType, userId)}/gst/gstr1/summary`,
            { params }
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const markGstr1Filed = async (
    payload: UserPayload & { gstin: string; financialYear: string; month: number }
) => {
    try {
        const { userId, userType, ...body } = payload;
        const resp: SuccessGenericResponse<{ count: number }> = await ApiClient.post(
            `${BASE(userType, userId)}/gst/gstr1/mark-filed`,
            body
        );
        return resp;
    } catch {
        return false;
    }
};

// ─── GST Portal Session (OTP-based, 6-hr session) ────────────────────────────

export const generateGstrEvcOtp = async (
    payload: UserPayload & { gstin: string; pan: string; gstrType?: 'gstr-1' | 'gstr-3b' }
) => {
    try {
        const { userId, userType, ...body } = payload;
        const resp: SuccessGenericResponse<Record<string, never>> = await ApiClient.post(
            `${BASE(userType, userId)}/gst/gstr1/evc-otp`,
            body
        );
        return resp;
    } catch {
        return false;
    }
};

export const generateGstPortalOtp = async (
    payload: UserPayload & { gstin: string; username: string }
) => {
    try {
        const { userId, userType, gstin, username } = payload;
        const resp: SuccessGenericResponse<{ maskedPhone: string | null }> = await ApiClient.post(
            `${BASE(userType, userId)}/gst/portal/otp`,
            { gstin, username }
        );
        return resp;
    } catch {
        return false;
    }
};

export const authenticateGstPortal = async (
    payload: UserPayload & { gstin: string; otp: string; username: string }
) => {
    try {
        const { userId, userType, gstin, otp, username } = payload;
        const resp: SuccessGenericResponse<{ expiresAt: number }> = await ApiClient.post(
            `${BASE(userType, userId)}/gst/portal/authenticate`,
            { gstin, otp, username }
        );
        return resp;
    } catch {
        return false;
    }
};

export const getGstPortalSession = async (payload: UserPayload & { gstin: string }) => {
    try {
        const { userId, userType, gstin } = payload;
        const resp: SuccessGenericResponse<{ connected: boolean }> = await ApiClient.get(
            `${BASE(userType, userId)}/gst/portal/session`,
            { params: { gstin } }
        );
        return resp.data;
    } catch {
        return false;
    }
};

// ─── Amendments ───────────────────────────────────────────────────────────────

export const addAmendments = async (
    payload: UserPayload & {
        gstin: string;
        financialYear: string;
        month: number;
        amendments: AmendmentPayload[];
    }
) => {
    try {
        const { userId, userType, ...body } = payload;
        const resp: SuccessGenericResponse<{ count: number }> = await ApiClient.post(
            `${BASE(userType, userId)}/gst/amendments`,
            body
        );
        return resp;
    } catch {
        return false;
    }
};

export const deleteAmendment = async (payload: UserPayload & { id: string }) => {
    try {
        const { userId, userType, id } = payload;
        const resp: SuccessGenericResponse<{}> = await ApiClient.delete(
            `${BASE(userType, userId)}/gst/amendments/${id}`
        );
        return resp;
    } catch {
        return false;
    }
};

// ─── GSTR-1 HSN Manual ────────────────────────────────────────────────────────

export const addGstr1HsnManual = async (payload: UserPayload & AddGstr1HsnPayload) => {
    try {
        const { userId, userType, ...body } = payload;
        const resp: SuccessGenericResponse<HsnSummaryRow & { id: number }> = await ApiClient.post(
            `${BASE(userType, userId)}/gst/gstr1/hsn`,
            body
        );
        return resp;
    } catch {
        return false;
    }
};

export const deleteGstr1HsnManual = async (payload: UserPayload & { id: string }) => {
    try {
        const { userId, userType, id } = payload;
        const resp: SuccessGenericResponse<{}> = await ApiClient.delete(
            `${BASE(userType, userId)}/gst/gstr1/hsn/${id}`
        );
        return resp;
    } catch {
        return false;
    }
};

// ─── GSTR-1 Documents ─────────────────────────────────────────────────────────

export const addGstr1Document = async (payload: UserPayload & AddGstr1DocumentPayload) => {
    try {
        const { userId, userType, ...body } = payload;
        const resp: SuccessGenericResponse<DocumentRow> = await ApiClient.post(
            `${BASE(userType, userId)}/gst/gstr1/documents`,
            body
        );
        return resp;
    } catch {
        return false;
    }
};

export const deleteGstr1Document = async (payload: UserPayload & { id: string }) => {
    try {
        const { userId, userType, id } = payload;
        const resp: SuccessGenericResponse<{}> = await ApiClient.delete(
            `${BASE(userType, userId)}/gst/gstr1/documents/${id}`
        );
        return resp;
    } catch {
        return false;
    }
};

// ─── GSTR-1 Portal Filing ─────────────────────────────────────────────────────

export const saveGstr1ToPortal = async (
    payload: UserPayload & { gstin: string; financialYear: string; month: number }
) => {
    try {
        const { userId, userType, ...body } = payload;
        const resp: SuccessGenericResponse<{ referenceId: string }> = await ApiClient.post(
            `${BASE(userType, userId)}/gst/gstr1/portal-save`,
            body
        );
        return resp;
    } catch {
        return false;
    }
};

export const getGstr1PortalSummary = async (
    payload: UserPayload & { gstin: string; financialYear: string; month: number }
) => {
    try {
        const { userId, userType, ...params } = payload;
        const resp: SuccessGenericResponse<Gstr1PortalSummary> = await ApiClient.get(
            `${BASE(userType, userId)}/gst/gstr1/portal-summary`,
            { params }
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const fileGstr1 = async (
    payload: UserPayload & {
        gstin: string;
        financialYear: string;
        month: number;
        pan: string;
        otp: string;
    }
) => {
    try {
        const { userId, userType, ...body } = payload;
        const resp: SuccessGenericResponse<{ ackNum: string; filedAt: string }> =
            await ApiClient.post(`${BASE(userType, userId)}/gst/gstr1/file`, body);
        return resp;
    } catch {
        return false;
    }
};

export const resetGstr1 = async (
    payload: UserPayload & { gstin: string; financialYear: string; month: number }
) => {
    try {
        const { userId, userType, ...body } = payload;
        const resp: SuccessGenericResponse<Record<string, never>> = await ApiClient.post(
            `${BASE(userType, userId)}/gst/gstr1/reset`,
            body
        );
        return resp;
    } catch {
        return false;
    }
};

// ─── GSTR-2B ─────────────────────────────────────────────────────────────────

export const getGstr2bData = async (
    payload: UserPayload & { gstin: string; financialYear: string; month: number }
) => {
    try {
        const { userId, userType, ...params } = payload;
        const resp: SuccessGenericResponse<Gstr2bApiResponse> = await ApiClient.get(
            `${BASE(userType, userId)}/gst/gstr2b`,
            { params }
        );
        return resp;
    } catch {
        return false;
    }
};

export const regenerateGstr2b = async (
    payload: UserPayload & { gstin: string; financialYear: string; month: number }
) => {
    try {
        const { userId, userType, ...body } = payload;
        const resp: SuccessGenericResponse<{ message: string }> = await ApiClient.post(
            `${BASE(userType, userId)}/gst/gstr2b/regenerate`,
            body
        );
        return resp;
    } catch {
        return false;
    }
};

export const getGstr2bRegenStatus = async (payload: UserPayload & { gstin: string }) => {
    try {
        const { userId, userType, gstin } = payload;
        const resp: SuccessGenericResponse<{ processing: boolean; errCode?: string }> =
            await ApiClient.get(`${BASE(userType, userId)}/gst/gstr2b/regen-status`, {
                params: { gstin },
            });
        return resp;
    } catch {
        return false;
    }
};

export const markGstr2bReconciled = async (
    payload: UserPayload & { gstin: string; financialYear: string; month: number }
) => {
    try {
        const { userId, userType, ...body } = payload;
        const resp: SuccessGenericResponse<{}> = await ApiClient.post(
            `${BASE(userType, userId)}/gst/gstr2b/mark-reconciled`,
            body
        );
        return resp;
    } catch {
        return false;
    }
};

export const getGstr2bReconciliationStatus = async (
    payload: UserPayload & { gstin: string; financialYear: string; month: number }
) => {
    try {
        const { userId, userType, ...params } = payload;
        const resp: SuccessGenericResponse<{ reconciled: boolean; reconciledAt: string | null }> =
            await ApiClient.get(`${BASE(userType, userId)}/gst/gstr2b/reconciliation-status`, {
                params,
            });
        return resp;
    } catch {
        return false;
    }
};

export const exportGstr2b = async (
    payload: UserPayload & {
        gstin: string;
        financialYear: string;
        month: number;
        type: string;
        search?: string;
        matchStatus?: string;
    }
) => {
    try {
        const { userId, userType, type, ...params } = payload;
        if (!params.search) delete params.search;
        if (!params.matchStatus) delete params.matchStatus;
        const resp: SuccessGenericResponse<{ buffer: { data: number[] }; fileType: string }> =
            await ApiClient.get(`${BASE(userType, userId)}/gst/gstr2b/export/${type}`, { params });
        return resp;
    } catch {
        return false;
    }
};

export const exportGstr2bReconciliationReport = async (
    payload: UserPayload & { gstin: string; financialYear: string; month: number }
) => {
    try {
        const { userId, userType, ...params } = payload;
        const resp: SuccessGenericResponse<{ buffer: { data: number[] }; fileType: string }> =
            await ApiClient.get(`${BASE(userType, userId)}/gst/gstr2b/reconciliation-report`, {
                params,
            });
        return resp;
    } catch {
        return false;
    }
};

// ─── GSTR-3B Filing ───────────────────────────────────────────────────────────

export const getGstr3bDetails = async (
    payload: UserPayload & { gstin: string; financialYear: string; month: number }
) => {
    try {
        const { userId, userType, ...params } = payload;
        const resp: SuccessGenericResponse<{
            formData: unknown;
            retPeriod: string;
            autoLiability: unknown;
            filingStatus: string;
        }> = await ApiClient.get(`${BASE(userType, userId)}/gst/gstr3b/details`, { params });
        return resp;
    } catch {
        return false;
    }
};

export const getGstr3bFiling = async (
    payload: UserPayload & { gstin: string; financialYear: string; month: number }
) => {
    try {
        const { userId, userType, ...params } = payload;
        const resp: SuccessGenericResponse<unknown> = await ApiClient.get(
            `${BASE(userType, userId)}/gst/gstr3b/filing`,
            { params }
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const updateGstr3bFormData = async (
    payload: UserPayload & {
        gstin: string;
        financialYear: string;
        month: number;
        formData: Record<string, unknown>;
    }
) => {
    try {
        const { userId, userType, ...body } = payload;
        const resp: SuccessGenericResponse<{}> = await ApiClient.put(
            `${BASE(userType, userId)}/gst/gstr3b/form-data`,
            body
        );
        return resp;
    } catch {
        return false;
    }
};

export const saveGstr3bToPortal = async (
    payload: UserPayload & { gstin: string; financialYear: string; month: number }
) => {
    try {
        const { userId, userType, ...body } = payload;
        const resp: SuccessGenericResponse<{}> = await ApiClient.post(
            `${BASE(userType, userId)}/gst/gstr3b/save`,
            body
        );
        return resp;
    } catch {
        return false;
    }
};

export const validateGstr3bReturn = async (
    payload: UserPayload & { gstin: string; financialYear: string; month: number }
) => {
    try {
        const { userId, userType, ...body } = payload;
        const resp: SuccessGenericResponse<{}> = await ApiClient.post(
            `${BASE(userType, userId)}/gst/gstr3b/validate`,
            body
        );
        return resp;
    } catch {
        return false;
    }
};

export const getGstr3bLedgers = async (
    payload: UserPayload & { gstin: string; financialYear: string; month: number }
) => {
    try {
        const { userId, userType, ...params } = payload;
        const resp: SuccessGenericResponse<{
            cashLedger: unknown;
            itcLedger: unknown;
            liabilityLedger: unknown;
        }> = await ApiClient.get(`${BASE(userType, userId)}/gst/gstr3b/ledgers`, { params });
        return resp;
    } catch {
        return false;
    }
};

export const offsetGstr3bLiability = async (
    payload: UserPayload & {
        gstin: string;
        financialYear: string;
        month: number;
        offsetData: Record<string, unknown>;
    }
) => {
    try {
        const { userId, userType, ...body } = payload;
        const resp: SuccessGenericResponse<unknown> = await ApiClient.post(
            `${BASE(userType, userId)}/gst/gstr3b/offset`,
            body
        );
        return resp;
    } catch {
        return false;
    }
};

export const getGstr3bAutoLiability = async (
    payload: UserPayload & { gstin: string; financialYear: string; month: number }
) => {
    try {
        const { userId, userType, ...params } = payload;
        const resp: SuccessGenericResponse<{ autoLiability: unknown }> = await ApiClient.get(
            `${BASE(userType, userId)}/gst/gstr3b/auto-liability`,
            { params }
        );
        return resp;
    } catch {
        return false;
    }
};

export const fileGstr3b = async (
    payload: UserPayload & {
        gstin: string;
        financialYear: string;
        month: number;
        pan: string;
        otp: string;
        isNil?: boolean;
    }
) => {
    try {
        const { userId, userType, ...body } = payload;
        const resp: SuccessGenericResponse<{ ackNum: string; filedAt: string }> =
            await ApiClient.post(`${BASE(userType, userId)}/gst/gstr3b/file`, body);
        return resp;
    } catch {
        return false;
    }
};

export const downloadGstr3bPdf = async (
    payload: UserPayload & { gstin: string; financialYear: string; month: number }
): Promise<{ buffer: { data: number[] }; fileType: string } | false> => {
    try {
        const { userId, userType, ...params } = payload;
        const resp: SuccessGenericResponse<{ buffer: { data: number[] }; fileType: string }> =
            await ApiClient.get(`${BASE(userType, userId)}/gst/gstr3b/export/pdf`, { params });
        return resp.data;
    } catch {
        return false;
    }
};

// ─── GSTIN Search ─────────────────────────────────────────────────────────────

export const searchGstin = async (payload: UserPayload & { gstin: string }) => {
    try {
        const { userId, userType, gstin } = payload;
        const resp: SuccessGenericResponse<GstinSearchResult> = await ApiClient.post(
            `${BASE(userType, userId)}/gst/gstin/search`,
            { gstin }
        );
        return resp;
    } catch {
        return false;
    }
};

// ─── Return Liability Ledger ──────────────────────────────────────────────────

export const getReturnLiability = async (
    payload: UserPayload & { gstin: string; financialYear: string; month: number }
) => {
    try {
        const { userId, userType, ...params } = payload;
        const resp: SuccessGenericResponse<ReturnLiabilityData> = await ApiClient.get(
            `${BASE(userType, userId)}/gst/ledger/liability`,
            { params }
        );
        return resp;
    } catch {
        return false;
    }
};

// ─── Cash Ledger Transactions ─────────────────────────────────────────────────

export const getItcLedger = async (
    payload: UserPayload & {
        gstin: string;
        financialYear: string;
        month: number;
        from?: string;
        to?: string;
        taxHead?: string;
    }
) => {
    try {
        const { userId, userType, ...params } = payload;
        const resp: SuccessGenericResponse<ItcLedgerData> = await ApiClient.get(
            `${BASE(userType, userId)}/gst/ledger/itc`,
            { params }
        );
        return resp;
    } catch {
        return false;
    }
};

export const exportItcLedger = async (
    payload: UserPayload & {
        gstin: string;
        financialYear: string;
        month: number;
        from?: string;
        to?: string;
        taxHead?: string;
    }
) => {
    try {
        const { userId, userType, ...params } = payload;
        const resp: SuccessGenericResponse<{ buffer: { data: number[] }; fileType: string }> =
            await ApiClient.get(`${BASE(userType, userId)}/gst/ledger/itc/export`, { params });
        return resp;
    } catch {
        return false;
    }
};

export const exportCashLedger = async (
    payload: UserPayload & {
        gstin: string;
        financialYear: string;
        month: number;
        from?: string;
        to?: string;
        taxHead?: string;
    }
) => {
    try {
        const { userId, userType, ...params } = payload;
        const resp: SuccessGenericResponse<{ buffer: { data: number[] }; fileType: string }> =
            await ApiClient.get(`${BASE(userType, userId)}/gst/ledger/cash/export`, { params });
        return resp;
    } catch {
        return false;
    }
};

export const getCashLedger = async (
    payload: UserPayload & {
        gstin: string;
        financialYear: string;
        month: number;
        from?: string;
        to?: string;
        taxHead?: string;
    }
) => {
    try {
        const { userId, userType, ...params } = payload;
        const resp: SuccessGenericResponse<CashLedgerData> = await ApiClient.get(
            `${BASE(userType, userId)}/gst/ledger/cash`,
            { params }
        );
        return resp;
    } catch {
        return false;
    }
};

// ─── PAN Search ───────────────────────────────────────────────────────────────

export const searchByPan = async (payload: UserPayload & { pan: string }) => {
    try {
        const { userId, userType, pan } = payload;
        const resp: SuccessGenericResponse<PanSearchResponse> = await ApiClient.post(
            `${BASE(userType, userId)}/gst/pan/search`,
            { pan }
        );
        return resp;
    } catch {
        return false;
    }
};

// ─── Add Customer ─────────────────────────────────────────────────────────────

export const addCustomer = async (payload: UserPayload & AddCustomerPayload) => {
    try {
        const { userId, userType, ...body } = payload;
        const resp: SuccessGenericResponse<{}> = await ApiClient.post(
            `${userType}/${userId}/officeAndBusiness/invoice-customer/v2`,
            body
        );
        return resp;
    } catch (error: any) {
        return error?.response?.data ?? false;
    }
};

// ─── Add Vendor (Procure) ──────────────────────────────────────────────────────

export const addVendor = async (payload: UserPayload & AddVendorPayload) => {
    try {
        const { userId, userType, ...body } = payload;
        const resp: SuccessGenericResponse<{}> = await ApiClient.post(
            `${userType}/${userId}/purchase/procure/vendors`,
            body
        );
        return resp;
    } catch (error: any) {
        return error?.response?.data ?? false;
    }
};

// ─── GSTR-9 ───────────────────────────────────────────────────────────────────

export const getGstr9Draft = async (
    payload: UserPayload & { gstin: string; financialYear: string }
) => {
    try {
        const { userId, userType, gstin, financialYear } = payload;
        const resp: SuccessGenericResponse<{
            formData?: Gstr9DraftData['formData'];
            requiresAuth?: boolean;
        }> = await ApiClient.get(`${BASE(userType, userId)}/gst/gstr9/auto-calculated`, {
            params: { gstin, financialYear },
        });

        if (!resp.status) {
            if (resp.data?.requiresAuth) {
                return { requiresAuth: true as const, message: resp.message };
            }
            const errResp = resp as unknown as { error_cd?: string };
            const warnings: Gstr9DraftData['warnings'] = errResp.error_cd
                ? [{ code: errResp.error_cd, type: 'warning', message: resp.message, detail: '' }]
                : [];
            return { status: null, formData: null, warnings, infoPoints: [] } as Gstr9DraftData;
        }

        const formData = resp.data?.formData ?? null;
        const t4 = formData?.table4;
        const hasTable4Data = (t4?.b2b?.txval ?? 0) > 0 || (t4?.b2c?.txval ?? 0) > 0;

        const infoPoints: string[] = [];
        // if (formData?.hsnMinLen) {
        //     infoPoints.push(
        //         `Based on your AATO, HSN codes must be at least ${formData.hsnMinLen} digits. This will be validated in Step 5.`
        //     );
        // }
        infoPoints.push(
            'GSTR-9 once filed cannot be revised. Review all values carefully before proceeding.'
        );

        const mapped: Gstr9DraftData = {
            status: 'draft',
            formData,
            aggregateTurnover: formData?.aggTurnover ?? null,
            portalSessionActive: formData?.aggTurnover !== undefined,
            gstr1AllFiled: hasTable4Data,
            warnings: [],
            infoPoints,
        };
        return mapped;
    } catch {
        return false;
    }
};

export const proceedGstr9 = async (
    payload: UserPayload & { gstin: string; financialYear: string }
) => {
    try {
        const { userId, userType, ...params } = payload;
        const resp: SuccessGenericResponse<{ formData: unknown; retPeriod: string }> =
            await ApiClient.get(`${BASE(userType, userId)}/gst/gstr9/details`, { params });
        return resp;
    } catch {
        return false;
    }
};

export const fileGstr9 = async (
    payload: UserPayload & {
        gstin: string;
        financialYear: string;
        pan: string;
        otp: string;
        formData: unknown;
    }
) => {
    try {
        const { userId, userType, ...body } = payload;
        const resp: SuccessGenericResponse<{ ackNum?: string; filedAt?: string }> =
            await ApiClient.post(`${BASE(userType, userId)}/gst/gstr9/file`, body);
        return resp;
    } catch {
        return false;
    }
};

export const saveGstr9Draft = async (
    payload: UserPayload & { gstin: string; financialYear: string; body: Gstr9SavePayload }
) => {
    try {
        const { userId, userType, gstin, financialYear, body } = payload;
        const resp: SuccessGenericResponse<{ referenceId?: string }> = await ApiClient.post(
            `${BASE(userType, userId)}/gst/gstr9/save`,
            { gstin, financialYear, formData: body }
        );
        return resp;
    } catch {
        return false;
    }
};

export const generateGstr9EvcOtp = async (
    payload: UserPayload & { gstin: string; pan: string }
) => {
    try {
        const { userId, userType, ...body } = payload;
        const resp: SuccessGenericResponse<Record<string, never>> = await ApiClient.post(
            `${BASE(userType, userId)}/gst/gstr9/evc-otp`,
            body
        );
        return resp;
    } catch {
        return false;
    }
};

export const getGstr9Section8A = async (
    payload: UserPayload & { gstin: string; financialYear: string }
) => {
    try {
        const { userId, userType, gstin, financialYear } = payload;
        const resp: SuccessGenericResponse<Gstr9Section8AData> = await ApiClient.get(
            `${BASE(userType, userId)}/gst/gstr9/section8a`,
            { params: { gstin, financialYear } }
        );
        return resp.data;
    } catch {
        return false;
    }
};

export type Gstr9FilingEntry = {
    filed: boolean;
    ackNum: string | null;
    filedAt: string | null;
    status: string | null;
};
export type Gstr9FilingsByYear = Record<string, Gstr9FilingEntry>;

export const getGstr9FilingStatus = async (payload: UserPayload & { gstin: string }) => {
    try {
        const { userId, userType, gstin } = payload;
        const resp: SuccessGenericResponse<{ filingsByYear: Gstr9FilingsByYear }> =
            await ApiClient.get(`${BASE(userType, userId)}/gst/gstr9/filing`, {
                params: { gstin },
            });
        return resp.data?.filingsByYear ?? null;
    } catch {
        return null;
    }
};

export const downloadGstr9Pdf = async (
    payload: UserPayload & { gstin: string; financialYear: string }
): Promise<{ buffer: { data: number[] }; fileType: string } | false> => {
    try {
        const { userId, userType, ...params } = payload;
        const resp: SuccessGenericResponse<{ buffer: { data: number[] }; fileType: string }> =
            await ApiClient.get(`${BASE(userType, userId)}/gst/gstr9/export/pdf`, { params });
        return resp.data;
    } catch {
        return false;
    }
};

// ─── Cash & ITC Balance Ledger ────────────────────────────────────────────────

export const getCashItcBalance = async (
    payload: UserPayload & { gstin: string; financialYear: string; month: number }
) => {
    try {
        const { userId, userType, ...params } = payload;
        const resp: SuccessGenericResponse<CashItcBalanceData> = await ApiClient.get(
            `${BASE(userType, userId)}/gst/ledger/balance`,
            { params }
        );
        return resp;
    } catch {
        return false;
    }
};

export const getSalesInvoiceImportTemplate = async (
    payload: UserPayload & { software: string }
) => {
    try {
        const { userId, userType, software } = payload;
        const resp: SuccessGenericResponse<{
            buffer: { data: number[] };
            fileType: string;
            fileName: string;
        }> = await ApiClient.get(`${BASE(userType, userId)}/gst/sales-invoices/import/template`, {
            params: { software },
        });
        return resp;
    } catch {
        return false;
    }
};

export const parseSalesInvoiceImport = async (
    payload: UserPayload & { file: File; software: string }
) => {
    try {
        const { userId, userType, file, software } = payload;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('software', software);
        const resp: SuccessGenericResponse<{ items: any[] }> = await ApiClient.post(
            `${BASE(userType, userId)}/gst/sales-invoices/import/parse`,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } } as any
        );
        return resp;
    } catch {
        return false;
    }
};

export const getFilingHistory = async (
    payload: UserPayload & { gstin: string; financialYear: string }
) => {
    try {
        const { userId, userType, ...params } = payload;
        const resp: SuccessGenericResponse<FilingHistoryEntry[]> = await ApiClient.get(
            `${BASE(userType, userId)}/gst/filing-history`,
            { params }
        );
        return resp.data;
    } catch {
        return false;
    }
};
