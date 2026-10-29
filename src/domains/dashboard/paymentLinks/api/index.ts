import { CommonFileBuffer } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    CreateDynamicQrPayload,
    CreateDynamicQrResponse,
    CreatePaymentLinkPayload,
    CreatePaymentLinkResponse,
    CreateSettlementRequestPayload,
    CreateSettlementRequestResponse,
    DashboardData,
    ENachMandateData,
    ENachMandateExecutionListResponse,
    ENachMandateExecutionListItem,
    ENachMandateInitiationGuard,
    ENachMandateListResponse,
    ENachMandatePayload,
    ENachMandateStatusData,
    ENachMandateValidationError,
    ExecuteENachMandatePaymentData,
    ExecuteENachMandatePaymentPayload,
    ExportBankDetailsPdfParams,
    ExportTransactionsParams,
    GetENachMandatesParams,
    GetTransactionsParams,
    GetVirtualAccountStatementParams,
    ManageENachMandateData,
    ManageENachMandatePayload,
    OnboardingProfileContext,
    OnboardingRecord,
    SendUpiCollectPayload,
    SendUpiCollectResponse,
    SettlementRequestsListResponse,
    Step1Payload,
    Step2Payload,
    TransactionDetailData,
    TransactionsPaginatedData,
    VerifyBankResponse,
    VirtualAccountBalanceData,
    VirtualAccountDetailsData,
    VirtualAccountStatementApiResponse,
    UpdateVirtualAccountPayload,
} from '../types/paymentLinkTypes';

export const sendUpiCollect = async ({
    userId,
    userType,
    ...payload
}: SendUpiCollectPayload): Promise<SendUpiCollectResponse | false> => {
    try {
        const resp: { data: SendUpiCollectResponse } = await ApiClient.post(
            `${userType}/${userId}/payment/payment-links/upi-collect-request`,
            payload
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const createENachMandate = async ({
    userId,
    userType,
    ...payload
}: ENachMandatePayload): Promise<ENachMandateData | ENachMandateValidationError | false> => {
    try {
        const resp: {
            status: true;
            responseCode: '000';
            message: string;
            data: ENachMandateData;
        } = await ApiClient.post(
            `${userType}/${userId}/payment/payment-links/enach-mandate`,
            payload
        );

        return resp.data;
    } catch (error: any) {
        const validationError = error?.response?.data;
        if (validationError?.code === 400 && Array.isArray(validationError?.errors)) {
            return validationError as ENachMandateValidationError;
        }
        return false;
    }
};

export const getENachMandates = async ({
    userId,
    userType,
    page = 1,
    limit = 10,
    search,
}: GetENachMandatesParams): Promise<ENachMandateListResponse | false> => {
    try {
        const params: Record<string, string | number> = { page, limit };
        if (search) params.search = search;

        const resp: any = await ApiClient.get(
            `${userType}/${userId}/payment/payment-links/enach-mandate`,
            {
                params,
            }
        );

        const payload = resp?.data ?? resp;

        if (Array.isArray(payload)) {
            return { rows: payload, total: payload.length };
        }

        if (Array.isArray(payload?.rows)) {
            return {
                rows: payload.rows,
                total: Number(payload?.count || payload?.total || payload.rows.length || 0),
            };
        }

        if (Array.isArray(payload?.data?.rows)) {
            return {
                rows: payload.data.rows,
                total: Number(
                    payload?.data?.count || payload?.data?.total || payload.data.rows.length || 0
                ),
            };
        }

        if (Array.isArray(payload?.data)) {
            return {
                rows: payload.data,
                total: Number(payload?.count || payload?.total || payload.data.length || 0),
            };
        }

        return { rows: [], total: 0 };
    } catch {
        return false;
    }
};

export const manageENachMandate = async ({
    userId,
    userType,
    reference_id,
}: ManageENachMandatePayload): Promise<ManageENachMandateData> => {
    const resp: any = await ApiClient.post(
        `${userType}/${userId}/payment/payment-links/enach-mandate/${reference_id}/manage`,
        { action: 'CANCEL' }
    );

    const payload = resp?.data ?? resp;
    return (payload?.data || payload) as ManageENachMandateData;
};

export const getENachMandateStatus = async ({
    userId,
    userType,
    reference_id,
}: {
    userId: string | number;
    userType: string;
    reference_id: string;
}): Promise<ENachMandateStatusData | false> => {
    try {
        const resp: any = await ApiClient.get(
            `${userType}/${userId}/payment/payment-links/enach-mandate/${reference_id}/status`
        );

        const payload = resp?.data ?? resp;
        return (payload?.data || payload) as ENachMandateStatusData;
    } catch {
        return false;
    }
};

export const executeENachMandatePayment = async ({
    userId,
    userType,
    reference_id,
    ...payload
}: ExecuteENachMandatePaymentPayload): Promise<ExecuteENachMandatePaymentData> => {
    const resp: any = await ApiClient.post(
        `${userType}/${userId}/payment/payment-links/enach-mandate/${reference_id}/execute`,
        payload
    );

    const responsePayload = resp?.data ?? resp;
    return (responsePayload?.data || responsePayload) as ExecuteENachMandatePaymentData;
};

export const getENachMandateExecutions = async ({
    userId,
    userType,
    reference_id,
    page = 1,
    limit = 10,
}: {
    userId: string | number;
    userType: string;
    reference_id: string;
    page?: number;
    limit?: number;
}): Promise<ENachMandateExecutionListResponse> => {
    const resp: any = await ApiClient.get(
        `${userType}/${userId}/payment/payment-links/enach-mandate/${reference_id}/executions`,
        {
            params: { page, limit },
        }
    );

    const payload = resp?.data ?? resp;
    const rows: ENachMandateExecutionListItem[] = payload?.data?.rows || payload?.rows || [];
    const total = Number(
        payload?.data?.count ||
            payload?.data?.total ||
            payload?.count ||
            payload?.total ||
            rows.length ||
            0
    );
    const initiationGuard: ENachMandateInitiationGuard | undefined =
        payload?.data?.initiation_guard || payload?.initiation_guard;

    return {
        rows,
        total,
        initiation_guard: initiationGuard,
    };
};

// ── Onboarding ────────────────────────────────────────────────────────────────

export const getOnboardingProfileContext = async ({
    userId,
    userType,
}: {
    userId: string | number;
    userType: string;
}): Promise<OnboardingProfileContext | false> => {
    try {
        const resp: { data: OnboardingProfileContext } = await ApiClient.get(
            `${userType}/${userId}/payment/payment-links/onboarding/profile-context`
        );
        return resp.data;
    } catch {
        return false;
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

export interface NupayBankVerifyResult {
    verified: boolean;
    accountHolderName?: string;
    message?: string;
}

// Verifies the merchant bank account before onboarding submission.
// Backend proxies to the NuPay verification API (endpoint to be finalised).
export const verifyNupayBankAccount = async ({
    userId,
    userType,
    accountNumber,
    ifsc,
    accountName,
}: {
    userId: string | number;
    userType: string;
    accountNumber: string;
    ifsc: string;
    accountName: string;
}): Promise<NupayBankVerifyResult | false> => {
    try {
        const resp: { data: NupayBankVerifyResult } = await ApiClient.post(
            `${userType}/${userId}/payment/payment-links/onboarding/nupay/verify-bank`,
            { accountNumber, ifsc, accountName }
        );
        return resp.data;
    } catch {
        return false;
    }
};

export interface NupayDocRef {
    url: string;
    filename: string;
    contentType: string;
}

// Uploads one onboarding document to storage and returns its reference.
export const uploadNupayOnboardingDoc = async ({
    userId,
    userType,
    file,
}: {
    userId: string | number;
    userType: string;
    file: File;
}): Promise<NupayDocRef> => {
    const fd = new FormData();
    fd.append('file', file);
    const resp: { data: NupayDocRef } = await ApiClient.post(
        `${userType}/${userId}/payment/payment-links/onboarding/nupay/upload-doc`,
        fd,
        { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return resp.data;
};

// Documents are sent as staged storage references, not files. Throws on failure.
export const submitNupayOnboarding = async ({
    userId,
    userType,
    payload,
}: {
    userId: string | number;
    userType: string;
    payload: Record<string, unknown>;
}): Promise<OnboardingRecord> => {
    const resp: { data: OnboardingRecord } = await ApiClient.post(
        `${userType}/${userId}/payment/payment-links/onboarding/nupay/submit`,
        payload
    );
    return resp.data;
};

export const saveOnboardingBankStep = async ({
    userId,
    userType,
    accountNumber,
    ifsc,
    bankName,
    name,
    phone,
    phoneOtp,
}: {
    userId: string | number;
    userType: string;
    accountNumber: string;
    ifsc: string;
    bankName?: string;
    name: string;
    phone?: string;
    phoneOtp?: string;
}): Promise<OnboardingRecord | false> => {
    try {
        const resp: { data: OnboardingRecord } = await ApiClient.post(
            `${userType}/${userId}/payment/payment-links/onboarding/step-bank`,
            {
                accountNumber,
                ifsc,
                bankName,
                name,
                ...(phone ? { phone } : {}),
                ...(phoneOtp ? { phoneOtp } : {}),
            }
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const sendBankPhoneOtp = async ({
    userId,
    userType,
    phone,
}: {
    userId: string | number;
    userType: string;
    phone: string;
}): Promise<{ status: boolean; message: string; data?: { otp?: string } | null }> => {
    try {
        const resp: { status: boolean; message: string; data?: { otp?: string } | null } =
            await ApiClient.post(
                `${userType}/${userId}/payment/payment-links/onboarding/phone-otp/send`,
                { phone }
            );
        return resp;
    } catch (err: any) {
        return {
            status: false,
            message: err?.response?.data?.message || err?.message || 'Failed to send OTP',
        };
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

export const exportBankDetailsPdf = async ({
    userId,
    userType,
    type,
}: ExportBankDetailsPdfParams): Promise<CommonFileBuffer | false> => {
    try {
        const resp: { data: CommonFileBuffer } = await ApiClient.get(
            `${userType}/${userId}/payment/payment-links/onboarding/bank-details/export/${type}`
        );
        return resp.data;
    } catch {
        return false;
    }
};

// ── Dashboard ────────────────────────────────────────────────────────────────

export const getDashboardData = async ({
    userId,
    userType,
}: {
    userId: string | number;
    userType: string;
}): Promise<DashboardData | false> => {
    try {
        const resp: { data: DashboardData } = await ApiClient.get(
            `${userType}/${userId}/payment/payment-links/dashboard`
        );
        return resp.data;
    } catch {
        return false;
    }
};

// ── Transactions ─────────────────────────────────────────────────────────────

export const getTransactions = async ({
    userId,
    userType,
    page = 1,
    limit = 10,
    status,
    search,
    paymentMethod,
}: GetTransactionsParams): Promise<TransactionsPaginatedData | false> => {
    try {
        const params: Record<string, string | number> = { page, limit };
        if (status) params.status = status;
        if (search) params.search = search;
        if (paymentMethod) params.paymentMethod = paymentMethod;
        const resp: { data: TransactionsPaginatedData } = await ApiClient.get(
            `${userType}/${userId}/payment/payment-links/transactions`,
            { params }
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const getTransactionDetail = async ({
    userId,
    userType,
    id,
}: {
    userId: string | number;
    userType: string;
    id: string;
}): Promise<TransactionDetailData | false> => {
    try {
        const resp: { data: TransactionDetailData } = await ApiClient.get(
            `${userType}/${userId}/payment/payment-links/transactions/${id}`
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const exportTransactionsReport = async ({
    userId,
    userType,
    type,
    status,
    search,
}: ExportTransactionsParams): Promise<CommonFileBuffer | false> => {
    try {
        const params: Record<string, string> = {};
        if (status) params.status = status;
        if (search) params.search = search;

        const resp: { data: CommonFileBuffer } = await ApiClient.get(
            `${userType}/${userId}/payment/payment-links/transactions/export/${type}`,
            { params }
        );
        return resp.data;
    } catch {
        return false;
    }
};

// ── Create Payment Link (payment service) ────────────────────────────────────

export const createPaymentLink = async ({
    userId,
    userType,
    ...payload
}: CreatePaymentLinkPayload): Promise<CreatePaymentLinkResponse | false> => {
    try {
        const resp: { data: CreatePaymentLinkResponse } = await ApiClient.post(
            `${userType}/${userId}/payment/payment-links`,
            payload
        );
        return resp.data;
    } catch {
        return false;
    }
};

// NuPay Collection 360 create-link (initiate_transaction). Separate from the Decentro
// createPaymentLink above so the legacy flow stays intact.
export const createNupayCollect = async ({
    userId,
    userType,
    ...payload
}: CreatePaymentLinkPayload): Promise<CreatePaymentLinkResponse | false> => {
    try {
        const resp: { data: CreatePaymentLinkResponse } = await ApiClient.post(
            `${userType}/${userId}/payment/payment-links/nupay/collect`,
            payload
        );
        return resp.data;
    } catch {
        return false;
    }
};

// ── Virtual Account Balance ───────────────────────────────────────────────────

export const getVirtualAccountBalance = async ({
    userId,
    userType,
}: {
    userId: string | number;
    userType: string;
}): Promise<VirtualAccountBalanceData | false> => {
    try {
        const resp: { data: VirtualAccountBalanceData } = await ApiClient.get(
            `${userType}/${userId}/payment/payment-links/virtual-account/balance`
        );
        return resp.data;
    } catch {
        return false;
    }
};

// ── Delete Virtual Account ────────────────────────────────────────────────────

export const deleteVirtualAccount = async ({
    userId,
    userType,
}: {
    userId: string | number;
    userType: string;
}): Promise<boolean> => {
    try {
        await ApiClient.delete(
            `${userType}/${userId}/payment/payment-links/virtual-account`
        );
        return true;
    } catch {
        return false;
    }
};

// ── Virtual Account Details ───────────────────────────────────────────────────

export const getVirtualAccountDetails = async ({
    userId,
    userType,
}: {
    userId: string | number;
    userType: string;
}): Promise<VirtualAccountDetailsData | false> => {
    try {
        const resp: { data: VirtualAccountDetailsData } = await ApiClient.get(
            `${userType}/${userId}/payment/payment-links/virtual-account/details`
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const updateVirtualAccount = async ({
    userId,
    userType,
    ...payload
}: UpdateVirtualAccountPayload): Promise<boolean> => {
    try {
        await ApiClient.put(
            `${userType}/${userId}/payment/payment-links/virtual-account`,
            payload
        );
        return true;
    } catch {
        return false;
    }
};

// ── Virtual Account Statement ─────────────────────────────────────────────────

export const getVirtualAccountStatement = async ({
    userId,
    userType,
    from,
    to,
    page = 1,
}: GetVirtualAccountStatementParams): Promise<VirtualAccountStatementApiResponse | false> => {
    try {
        const resp: { data: VirtualAccountStatementApiResponse } = await ApiClient.get(
            `${userType}/${userId}/payment/payment-links/virtual-account/statement`,
            { params: { from, to, page } }
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const exportVirtualAccountStatement = async ({
    userId,
    userType,
    from,
    to,
}: {
    userId: string | number;
    userType: string;
    from: string;
    to: string;
}): Promise<{ buffer: { type: string; data: number[] } } | { error: string }> => {
    try {
        const resp: any = await ApiClient.get(
            `${userType}/${userId}/payment/payment-links/virtual-account/statement/export`,
            { params: { from, to } }
        );
        if (resp?.data?.buffer) return { buffer: resp.data.buffer };
        return { error: resp?.message || 'Export failed' };
    } catch (err: any) {
        return { error: err?.response?.data?.message || 'Export failed' };
    }
};

// ── Settlement Requests ───────────────────────────────────────────────────────

export const createSettlementRequest = async ({
    userId,
    userType,
    ...payload
}: CreateSettlementRequestPayload): Promise<CreateSettlementRequestResponse | false> => {
    try {
        const resp: { data: CreateSettlementRequestResponse } = await ApiClient.post(
            `${userType}/${userId}/payment/payment-links/settlement/request`,
            payload
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const getSettlementRequests = async ({
    userId,
    userType,
    page = 1,
    limit = 20,
}: {
    userId: string | number;
    userType: string;
    page?: number;
    limit?: number;
}): Promise<SettlementRequestsListResponse | false> => {
    try {
        const resp: { data: SettlementRequestsListResponse } = await ApiClient.get(
            `${userType}/${userId}/payment/payment-links/settlement/requests`,
            { params: { page, limit } }
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const createDynamicQr = async ({
    userId,
    userType,
    ...payload
}: CreateDynamicQrPayload): Promise<CreateDynamicQrResponse | false> => {
    try {
        const resp: { data: CreateDynamicQrResponse } = await ApiClient.post(
            `${userType}/${userId}/payment/payment-links/qr`,
            payload
        );
        return resp.data;
    } catch {
        return false;
    }
};
