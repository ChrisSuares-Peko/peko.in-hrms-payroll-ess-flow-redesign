import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';
import { formattedDateOnly } from '@utils/dateFormat';

import {
    ReceiptApiItem,
    deleteTransactionReceipt,
    getTransactionReceipts,
    uploadTransactionReceipt,
} from '../../api/user/transactionsApi';
import { ReceiptFile } from '../../utils/types';

const toReceiptFile = (r: ReceiptApiItem): ReceiptFile => ({
    key: String(r.id),
    id: r.id,
    fileName: r.fileName,
    date: r.createdAt ? formattedDateOnly(new Date(r.createdAt)) : '—',
    uploadedBy: r.uploadedByRole
        ? r.uploadedByRole.charAt(0) + r.uploadedByRole.slice(1).toLowerCase()
        : '—',
    url: r.fileUrl ?? undefined,
    mimeType: r.mimeType ?? undefined,
});

const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

export const useTransactionReceiptsApi = (transactionId: string | null) => {
    const { role, id, roleName } = useAppSelector(state => state.reducer.auth);
    const apiRole: 'ADMIN' | 'CARDHOLDER' = roleName?.toLowerCase().includes('admin')
        ? 'ADMIN'
        : 'CARDHOLDER';
    const [receipts, setReceipts] = useState<ReceiptFile[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const fetchReceipts = useCallback(async () => {
        if (!transactionId) return;
        setIsLoading(true);
        const res = await getTransactionReceipts(role, id, transactionId);
        if (res && res.data?.receipts) {
            setReceipts(res.data.receipts.map(r => toReceiptFile(r)));
        }
        setIsLoading(false);
    }, [role, id, transactionId]);

    useEffect(() => {
        fetchReceipts();
    }, [fetchReceipts]);

    const deleteReceipt = async (receiptId: number): Promise<boolean> => {
        if (!transactionId) return false;
        const res = await deleteTransactionReceipt(role, id, transactionId, receiptId);
        if (res) await fetchReceipts();
        return !!res;
    };

    const upload = async (file: File, uploadAsRole?: 'ADMIN' | 'CARDHOLDER'): Promise<boolean> => {
        if (!transactionId) return false;
        setIsUploading(true);
        const base64 = await fileToBase64(file);
        const res = await uploadTransactionReceipt(role, id, transactionId, {
            base64,
            fileName: file.name,
            mimeType: file.type,
            role: uploadAsRole ?? apiRole,
        });
        if (res) await fetchReceipts();
        setIsUploading(false);
        return !!res;
    };

    return { receipts, isLoading, isUploading, upload, deleteReceipt };
};
