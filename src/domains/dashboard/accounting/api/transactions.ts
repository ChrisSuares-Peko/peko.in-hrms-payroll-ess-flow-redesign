import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

const basePath = (userType: string, userId: number) =>
    `${userType}/${userId}/officeAndBusiness/accounting/transactions`;

export type TransactionKind = 'Income' | 'Expense';

export interface CreateTransactionPayload extends UserPayload {
    txnDate: string;
    description: string;
    amount: number;
    type: TransactionKind;
    account?: string;
    category?: string;
    note?: string;
}

export interface CreatedTransaction {
    id: number;
}

export const createTransaction = async (payload: CreateTransactionPayload) => {
    try {
        const { userId, userType, ...body } = payload;
        const resp: SuccessGenericResponse<CreatedTransaction> = await ApiClient.post(
            basePath(userType, userId),
            body
        );
        return resp.status ? resp.data : false;
    } catch {
        return false;
    }
};

export interface UploadTransactionDocumentPayload extends UserPayload {
    transactionId: number | string;
    documentBase64: string;
    fileName: string;
    format: string;
    mimeType?: string;
}

export const uploadTransactionDocument = async (payload: UploadTransactionDocumentPayload) => {
    try {
        const { userId, userType, transactionId, ...body } = payload;
        const resp: SuccessGenericResponse<{ id: number; url: string; name: string }> =
            await ApiClient.post(`${basePath(userType, userId)}/${transactionId}/documents`, body);
        return resp.status ? resp.data : false;
    } catch {
        return false;
    }
};

export interface ParseStatementPayload extends UserPayload {
    fileBase64: string;
    fileName: string;
    format: string;
    mimeType?: string;
    bankAccountId?: number;
    password?: string;
}

// Returned when the uploaded PDF is password-protected and needs a password.
export interface LockedStatementResult {
    locked: true;
    invalidPassword?: boolean;
}

export interface ParsedStatementQuality {
    score: number;
    total: number;
    reconciled: number;
    needsReview: number;
    categorized: number;
}

export interface ParsedStatementSummary {
    totalImported: number;
    credits: { count: number; amount: number };
    debits: { count: number; amount: number };
    categorizedPercent: number;
    statementStart: string | null;
    statementEnd: string | null;
}

export interface ParsedStatementResult {
    batchId: number;
    transactions: ApiTransaction[];
    quality: ParsedStatementQuality;
    summary: ParsedStatementSummary;
}

// Upload a bank statement (CSV, Excel, or PDF) → Gemini extracts + verifies → returns a draft import.
// Returns a LockedStatementResult when a password-protected PDF needs a password.
export const parseStatement = async (payload: ParseStatementPayload) => {
    try {
        const { userId, userType, ...body } = payload;
        const resp: SuccessGenericResponse<ParsedStatementResult | LockedStatementResult> =
            // statement parsing is slow (Gemini); needs more than the global 15s timeout
            await ApiClient.post(`${basePath(userType, userId)}/import/parse`, body, {
                timeout: 120000,
            });
        return resp.status ? resp.data : false;
    } catch {
        return false;
    }
};

export const confirmStatementImport = async (payload: UserPayload & { batchId: number }) => {
    try {
        const { userId, userType, batchId } = payload;
        const resp: SuccessGenericResponse<{ batchId: number; status: string }> =
            await ApiClient.post(`${basePath(userType, userId)}/import/${batchId}/confirm`, {});
        return resp.status ? resp.data : false;
    } catch {
        return false;
    }
};

// Discard a draft import (and its rows) when the user cancels before confirming.
export const discardStatementImport = async (payload: UserPayload & { batchId: number }) => {
    try {
        const { userId, userType, batchId } = payload;
        const resp: SuccessGenericResponse<unknown> = await ApiClient.delete(
            `${basePath(userType, userId)}/import/${batchId}`
        );
        return Boolean(resp.status);
    } catch {
        return false;
    }
};

export interface ApiTransactionLink {
    id: number;
    targetType: string;
    targetId: number;
    amountApplied: number | null;
}

export interface ApiTransactionDocument {
    id: number;
    name: string;
    url: string;
    mimeType: string | null;
    fileSize: number | null;
}

export interface ApiTransaction {
    id: number;
    account: string;

    bankAccountId: number | null;
    date: string;
    description: string;
    amount: number;
    type: TransactionKind;
    currency: string;
    category: string | null;
    recurring: boolean;
    hidden: boolean;
    note: string | null;
    reviewedAt: string | null;
    statuses: string[];

    links?: ApiTransactionLink[];
    documents?: ApiTransactionDocument[];
}

export interface TransactionCounts {
    all: number;
    needs_review: number;
    matched: number;
    recurring: number;
    hidden: number;
}

export interface GetTransactionsResponse {
    transactions: ApiTransaction[];
    recordsTotal: number;
    counts: TransactionCounts;
}

export interface GetTransactionsParams extends UserPayload {
    tab?: string;
    searchText?: string;
    type?: string;
    category?: string;
    source?: string;
    bankAccount?: string;
    status?: string;
    // FY-based filtering (preferred): fy alone = full financial year; fy + month = single
    // calendar month; fy + quarter = fiscal quarter. fy overrides from/to when present.
    fy?: number;
    month?: number;
    quarter?: number;
    // Explicit range — used only when fy is absent.
    from?: string;
    to?: string;
    page?: number;
    itemsPerPage?: number;
    sort?: 'ASC' | 'DESC';
    sortField?: 'txnDate' | 'amount' | 'createdAt';
}

export interface FinancialAccount {
    id: number;
    accountName: string;
    accountNumber: string | null;
    bankName: string | null;
    ifscCode: string | null;
    accountType: string;
    currency: string;
}

export const getFinancialAccounts = async (payload: UserPayload) => {
    try {
        const { userId, userType } = payload;
        const resp: SuccessGenericResponse<FinancialAccount[]> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/accounting/financial-accounts`
        );
        return resp.status ? resp.data : false;
    } catch {
        return false;
    }
};

export interface ExportTransactionsParams extends GetTransactionsParams {
    format: 'excel' | 'csv';
}

export const exportTransactions = async (payload: ExportTransactionsParams) => {
    try {
        const { userId, userType, format, ...params } = payload;
        const resp: SuccessGenericResponse<{ buffer: { data: number[] }; fileType: string }> =
            await ApiClient.get(`${basePath(userType, userId)}/export/${format}`, { params });
        return resp.status ? resp.data : false;
    } catch {
        return false;
    }
};

export interface ExportSelectedTransactionsPayload extends UserPayload {
    // anything other than 'csv' is treated as excel by the backend
    format: 'excel' | 'csv';
    // 1–5000 positive integer transaction ids
    ids: number[];
}

// File buffer returned by the selected-rows export endpoint. Normally a base64
// string, but some environments serialize it as a Node Buffer ({ data: number[] }).
export interface ExportedFile {
    buffer: string | { data: number[] };
    fileType: 'xlsx' | 'csv';
}

// Exports only the given transactions (checkbox selection) to excel/csv.
export const exportSelectedTransactions = async (payload: ExportSelectedTransactionsPayload) => {
    try {
        const { userId, userType, format, ids } = payload;
        const resp: SuccessGenericResponse<ExportedFile> = await ApiClient.post(
            `${basePath(userType, userId)}/export/${format}`,
            { ids }
        );
        return resp.status ? resp.data : false;
    } catch {
        return false;
    }
};

export const getTransactions = async (payload: GetTransactionsParams) => {
    try {
        const { userId, userType, ...params } = payload;
        const resp: SuccessGenericResponse<GetTransactionsResponse> = await ApiClient.get(
            basePath(userType, userId),
            { params }
        );
        return resp.status ? resp.data : false;
    } catch {
        return false;
    }
};

interface TransactionMutationPayload extends UserPayload {
    transactionId: number | string;
}

const patchTransaction = async (
    { userId, userType, transactionId }: TransactionMutationPayload,
    subPath: string,
    body: Record<string, unknown>
) => {
    try {
        const resp: SuccessGenericResponse<ApiTransaction> = await ApiClient.patch(
            `${basePath(userType, userId)}/${transactionId}/${subPath}`,
            body
        );
        return resp.status ? resp.data : false;
    } catch {
        return false;
    }
};

export const updateTransactionNote = (payload: TransactionMutationPayload & { note: string }) =>
    patchTransaction(payload, 'note', { note: payload.note });

export const updateTransactionCategory = (
    payload: TransactionMutationPayload & { category: string; reviewed?: boolean }
) =>
    patchTransaction(payload, 'category', {
        category: payload.category,
        ...(payload.reviewed !== undefined ? { reviewed: payload.reviewed } : {}),
    });

export const toggleTransactionRecurring = (
    payload: TransactionMutationPayload & { isRecurring: boolean }
) => patchTransaction(payload, 'recurring', { isRecurring: payload.isRecurring });

export const toggleTransactionHidden = (
    payload: TransactionMutationPayload & { isHidden: boolean }
) => patchTransaction(payload, 'hidden', { isHidden: payload.isHidden });

export const updateTransactionAccount = (
    payload: TransactionMutationPayload & { account: string }
) => patchTransaction(payload, 'account', { account: payload.account });

export interface LinkableInvoice {
    id: number;
    targetType: string;
    reference: string;
    party: string | null;
    date: string | null;
    amount: number | null;
    status: string | null;
}

export interface GetLinkableInvoicesParams extends UserPayload {
    searchText?: string;
    page?: number;
    itemsPerPage?: number;
}

export const getLinkableInvoices = async (payload: GetLinkableInvoicesParams) => {
    try {
        const { userId, userType, ...params } = payload;
        const resp: SuccessGenericResponse<{
            invoices: LinkableInvoice[];
            recordsTotal: number;
        }> = await ApiClient.get(`${basePath(userType, userId)}/linkable/invoices`, { params });
        return resp.status ? resp.data : false;
    } catch {
        return false;
    }
};

export interface TransactionLinkInput {
    targetType: string;
    targetId: number;
    amountApplied?: number;
}

export const createTransactionLinks = async (
    payload: TransactionMutationPayload & { links: TransactionLinkInput[] }
) => {
    try {
        const { userId, userType, transactionId, links } = payload;
        const resp: SuccessGenericResponse<ApiTransaction> = await ApiClient.post(
            `${basePath(userType, userId)}/${transactionId}/links`,
            { links }
        );
        return resp.status ? resp.data : false;
    } catch {
        return false;
    }
};

export const deleteTransactionLink = async (
    payload: TransactionMutationPayload & { linkId: number }
) => {
    try {
        const { userId, userType, transactionId, linkId } = payload;
        const resp: SuccessGenericResponse<unknown> = await ApiClient.delete(
            `${basePath(userType, userId)}/${transactionId}/links/${linkId}`
        );
        return Boolean(resp.status);
    } catch {
        return false;
    }
};

export const deleteTransactionDocument = async (
    payload: TransactionMutationPayload & { documentId: number }
) => {
    try {
        const { userId, userType, transactionId, documentId } = payload;
        const resp: SuccessGenericResponse<unknown> = await ApiClient.delete(
            `${basePath(userType, userId)}/${transactionId}/documents/${documentId}`
        );
        return Boolean(resp.status);
    } catch {
        return false;
    }
};
