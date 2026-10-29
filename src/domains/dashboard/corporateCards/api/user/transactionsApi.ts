import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

export interface TransactionItem {
    id: number;
    cardLast4: string;
    date: string;
    merchant: string;
    member: string;
    /** The cardholder's `users.id` — the exact value the filter targets (names aren't unique). */
    holderId: string | null;
    status: string;
    approval: string;
    /** Why this charge needs a manual look (e.g. a JIT decline reason). Null for an authorized charge. */
    declineReason: string | null;
    fee: number;
    amount: number;
    transactionId?: string;
    category?: string;
}

interface TransactionsResponse {
    count: number;
    rows: TransactionItem[];
}

export interface GetTransactionsParams {
    page: number;
    itemsPerPage: number;
    status?: string;
    category?: string;
    dateFrom?: string;
    dateTo?: string;
    searchText?: string;
    userId?: string | number;
    cardLast4?: string;
}

export type ExportTransactionsParams = Omit<GetTransactionsParams, 'page' | 'itemsPerPage'> & {
    variant?: 'admin' | 'user';
};

export const exportTransactions = async (
    userType: string,
    userId: number,
    params: ExportTransactionsParams
): Promise<Blob | false> => {
    try {
        const blob = (await ApiClient.get(
            `${userType}/${userId}/corporate-cards/transactions/export`,
            { params, responseType: 'blob' }
        )) as unknown as Blob;
        return blob;
    } catch {
        return false;
    }
};

export const getUserTransactions = async (
    userType: string,
    userId: number,
    params: GetTransactionsParams
) => {
    try {
        const res: SuccessGenericResponse<TransactionsResponse> = await ApiClient.get(
            `${userType}/${userId}/corporate-cards/transactions`,
            { params }
        );
        return res;
    } catch {
        return false;
    }
};

/** Detail row from GET /transactions/:id — serializeTransactionDetail shape (transaction + cardholder). */
export interface TransactionDetailItem {
    id: number;
    displayId: string;
    maskedCardNumber: string | null;
    merchantName: string | null;
    merchantCity: string | null;
    category: string | null;
    transactionAmount: number;
    status: string;
    declineReason: string | null;
    createdAt: string;
    notifiedAt: string | null;
    cardholder: {
        name: string;
        email: string;
        team: string | null;
        role: string;
    } | null;
}

interface TransactionDetailResponse {
    transaction: TransactionDetailItem;
}

export interface ReceiptApiItem {
    id: number;
    fileName: string;
    mimeType: string | null;
    createdAt: string;
    uploadedByRole: string | null;
    fileUrl: string | null;
}

interface ReceiptsResponse {
    receipts: ReceiptApiItem[];
}

export interface UploadReceiptPayload {
    base64: string;
    fileName: string;
    mimeType: string;
    role: 'ADMIN' | 'CARDHOLDER';
}

export const getTransactionReceipts = async (
    userType: string,
    userId: number,
    transactionId: string
) => {
    try {
        const res: SuccessGenericResponse<ReceiptsResponse> = await ApiClient.get(
            `${userType}/${userId}/corporate-cards/transactions/${transactionId}/receipts`
        );
        return res;
    } catch {
        return false;
    }
};

export const deleteTransactionReceipt = async (
    userType: string,
    userId: number,
    transactionId: string,
    receiptId: number
) => {
    try {
        const res: SuccessGenericResponse<unknown> = await ApiClient.delete(
            `${userType}/${userId}/corporate-cards/transactions/${transactionId}/receipts/${receiptId}`
        );
        return res;
    } catch {
        return false;
    }
};

export const uploadTransactionReceipt = async (
    userType: string,
    userId: number,
    transactionId: string,
    payload: UploadReceiptPayload
) => {
    try {
        const res: SuccessGenericResponse<{ id: string }> = await ApiClient.post(
            `${userType}/${userId}/corporate-cards/transactions/${transactionId}/receipts`,
            payload
        );
        return res;
    } catch {
        return false;
    }
};

export interface CommentApiItem {
    id: string;
    message: string;
    createdAt: string;
    authorName: string;
    authorRole: string;
    authorEmail: string;
    authorUserId: string;
}

interface CommentsResponse {
    comments: CommentApiItem[];
}

export const getTransactionComments = async (
    userType: string,
    userId: number,
    transactionId: string
) => {
    try {
        const res: SuccessGenericResponse<CommentsResponse> = await ApiClient.get(
            `${userType}/${userId}/corporate-cards/transactions/${transactionId}/comments`
        );
        return res;
    } catch {
        return false;
    }
};

export const postTransactionComment = async (
    userType: string,
    userId: number,
    transactionId: string,
    message: string,
    role: 'ADMIN' | 'CARDHOLDER'
) => {
    try {
        const res: SuccessGenericResponse<{ id: number }> = await ApiClient.post(
            `${userType}/${userId}/corporate-cards/transactions/${transactionId}/comments`,
            { message, role }
        );
        return res;
    } catch {
        return false;
    }
};

export const approveTransactionDecision = async (
    userType: string,
    userId: number,
    transactionId: number,
    decision: 'APPROVED' | 'REJECTED'
) => {
    try {
        const res: SuccessGenericResponse<unknown> = await ApiClient.post(
            `${userType}/${userId}/corporate-cards/transactions/${transactionId}/approval`,
            { decision }
        );
        return res;
    } catch {
        return false;
    }
};

export const getTransactionDetail = async (
    userType: string,
    userId: number,
    transactionId: string
) => {
    try {
        const res: SuccessGenericResponse<TransactionDetailResponse> = await ApiClient.get(
            `${userType}/${userId}/corporate-cards/transactions/${transactionId}`
        );
        return res;
    } catch {
        return false;
    }
};
