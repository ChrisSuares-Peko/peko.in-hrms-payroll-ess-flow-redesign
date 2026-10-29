import { useCallback, useEffect, useState } from 'react';

import { saveAs } from 'file-saver';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    downloadManualPaymentReceiptApi,
    getAllManualPaymentsApi,
    sendManualPaymentReceiptEmailApi,
} from '../api/collectPayment';
import { InvoicePaymentRow } from '../types/CollectPayment';

const getPdfBufferData = (data: any): number[] | undefined =>
    data?.pdfBuffer?.data ?? data?.buffer?.data;

export interface InvoicePaymentsFilters {
    searchText: string;
    page: number;
    limit: number;
    sort: 'ASC' | 'DESC';
    sortField: string;
    startDate: string;
    endDate: string;
}

const useInvoicePayments = (filters: InvoicePaymentsFilters) => {
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();

    const [rows, setRows] = useState<InvoicePaymentRow[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [downloadingId, setDownloadingId] = useState<number | null>(null);
    const [sharingId, setSharingId] = useState<number | null>(null);

    const fetchPayments = useCallback(async () => {
        setIsLoading(true);
        const result = await getAllManualPaymentsApi({
            userId,
            userType,
            page: filters.page,
            itemsPerPage: filters.limit,
            searchText: filters.searchText,
            from: filters.startDate,
            to: filters.endDate,
            sort: filters.sort,
            sortField: filters.sortField,
        });
        if (result) {
            setRows(result.payments);
            setTotal(result.recordsTotal);
        }
        setIsLoading(false);
    }, [userId, userType, filters]);

    useEffect(() => {
        fetchPayments();
    }, [fetchPayments]);

    const downloadReceipt = useCallback(
        async (invoiceId: number, paymentId: number): Promise<boolean> => {
            setDownloadingId(paymentId);
            const result = await downloadManualPaymentReceiptApi({
                userId,
                userType,
                invoiceId: String(invoiceId),
                paymentId,
            });
            setDownloadingId(null);
            if (result) {
                const bufferData = getPdfBufferData(result);
                if (!bufferData) {
                    dispatch(showToast({ description: 'Failed to download receipt.', variant: 'error' }));
                    return false;
                }
                const blob = new Blob([new Uint8Array(bufferData)], { type: 'application/pdf' });
                saveAs(blob, `${result.receiptNo}.pdf`);
                return true;
            }
            dispatch(showToast({ description: 'Failed to download receipt.', variant: 'error' }));
            return false;
        },
        [userId, userType, dispatch]
    );

    const shareReceipt = useCallback(
        async (invoiceId: number, paymentId: number) => {
            setSharingId(paymentId);
            const result = await sendManualPaymentReceiptEmailApi({
                userId,
                userType,
                invoiceId: String(invoiceId),
                paymentId,
            });
            dispatch(
                showToast({
                    description: result.success
                        ? 'Receipt shared successfully.'
                        : result.message || 'Failed to share receipt.',
                    variant: result.success ? 'success' : 'error',
                })
            );
            setSharingId(null);
            return result.success;
        },
        [userId, userType, dispatch]
    );

    return {
        rows,
        total,
        isLoading,
        downloadReceipt,
        shareReceipt,
        downloadingId,
        sharingId,
    };
};

export default useInvoicePayments;
