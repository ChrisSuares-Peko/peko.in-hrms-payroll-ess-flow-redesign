import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';
import { formattedDateOnly } from '@utils/dateFormat';

import {
    deleteReceipt as deleteReceiptApi,
    getReceipts,
    ReceiptApiItem,
    uploadReceipt as uploadReceiptApi,
} from '../../api/user/receiptsApi';
import { ReceiptFile } from '../../utils/types';

const toReceipt = (r: ReceiptApiItem): ReceiptFile => ({
    key: String(r.id),
    id: r.id,
    fileName: r.fileName || 'Receipt',
    date: r.createdAt ? formattedDateOnly(new Date(r.createdAt)) : '',
    uploadedBy: r.uploadedByRole === 'ADMIN' ? 'Admin' : 'Cardholder',
    url: r.fileUrl,
    mimeType: r.mimeType,
});

const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Could not read file.'));
        reader.readAsDataURL(file);
    });

export const useReceiptsApi = (transactionId: string | null) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [receipts, setReceipts] = useState<ReceiptFile[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const fetchReceipts = useCallback(async () => {
        if (!transactionId) return;
        setIsLoading(true);
        const res = await getReceipts(role, id, transactionId);
        if (res && res.data?.receipts) setReceipts(res.data.receipts.map(toReceipt));
        setIsLoading(false);
    }, [role, id, transactionId]);

    useEffect(() => {
        fetchReceipts();
    }, [fetchReceipts]);

    const upload = async (file: File) => {
        if (!transactionId) return;
        setUploading(true);
        try {
            const base64 = await fileToBase64(file);
            const res = await uploadReceiptApi(role, id, transactionId, {
                base64,
                fileName: file.name,
                mimeType: file.type,
            });
            if (res) {
                dispatch(showToast({ variant: 'success', description: 'Receipt uploaded.' }));
                await fetchReceipts();
            }
        } finally {
            setUploading(false);
        }
    };

    const remove = async (receiptId: number) => {
        if (!transactionId) return;
        const res = await deleteReceiptApi(role, id, transactionId, receiptId);
        if (res) {
            dispatch(showToast({ variant: 'success', description: 'Receipt deleted.' }));
            await fetchReceipts();
        }
    };

    return { receipts, isLoading, upload, uploading, remove, refetch: fetchReceipts };
};
