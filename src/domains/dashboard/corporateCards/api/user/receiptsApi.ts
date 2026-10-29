import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

/** A receipt row from GET /transactions/:id/receipts — serializeReceipt shape. */
export interface ReceiptApiItem {
    id: number;
    fileUrl: string;
    fileName: string | null;
    mimeType: string;
    uploadedByRole: string;
    createdAt: string;
}

interface ReceiptsResponse {
    receipts: ReceiptApiItem[];
}

export interface UploadReceiptPayload {
    base64: string;
    fileName: string;
    mimeType: string;
}

export const getReceipts = async (userType: string, userId: number, transactionId: string) => {
    try {
        const res: SuccessGenericResponse<ReceiptsResponse> = await ApiClient.get(
            `${userType}/${userId}/corporate-cards/transactions/${transactionId}/receipts`
        );
        return res;
    } catch {
        return false;
    }
};

export const uploadReceipt = async (
    userType: string,
    userId: number,
    transactionId: string,
    payload: UploadReceiptPayload
) => {
    try {
        const res: SuccessGenericResponse<unknown> = await ApiClient.post(
            `${userType}/${userId}/corporate-cards/transactions/${transactionId}/receipts`,
            payload
        );
        return res;
    } catch {
        return false;
    }
};

export const deleteReceipt = async (
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
