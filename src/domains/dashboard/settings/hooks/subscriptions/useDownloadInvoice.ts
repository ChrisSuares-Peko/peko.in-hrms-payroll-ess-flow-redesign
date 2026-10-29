import { useState, useCallback } from 'react';

import { saveAs } from 'file-saver';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { downloadInvoice, downloadTransactionDocument } from '../../api/subscription';
import { downloadResponse } from '../../types/subscription';

const GENERIC_ERROR =
    'Something went wrong. If the issue persists, please contact support at reach@peko.one';

export const useDownloadInvoice = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);

    // Legacy users-svc invoice download — kept for rows without a corporateTxnId
    // (pre-feature subscriptions whose invoice is only reachable via this renderer).
    const getInvoiceData = useCallback(
        async (invoiceId: number, record: any) => {
            if (isLoading) setIsLoading(true);
            const data: downloadResponse | false = await downloadInvoice(
                invoiceId,
                record.tableName
            );
            if (data) {
                const uint8Array = new Uint8Array(data.pdfBuffer.data);

                const blob = new Blob([uint8Array], { type: 'application/pdf' });

                saveAs(blob, 'Invoice.pdf');
            } else {
                dispatch(showToast({ description: GENERIC_ERROR, variant: 'error' }));
            }
            setIsLoading(false);
        },
        [isLoading, dispatch]
    );

    // Common download API (others MS) — invoice or receipt by corporateTxnId.
    const getDocumentData = useCallback(
        async (corporateTxnId: string | number, type: 'invoice' | 'receipt') => {
            if (isLoading) setIsLoading(true);
            const data: downloadResponse | false = await downloadTransactionDocument(
                role,
                id,
                corporateTxnId,
                type
            );
            if (data) {
                const uint8Array = new Uint8Array(data.pdfBuffer.data);

                const blob = new Blob([uint8Array], { type: 'application/pdf' });

                saveAs(blob, `${type === 'invoice' ? 'Invoice' : 'Receipt'}-${corporateTxnId}.pdf`);
            } else {
                dispatch(showToast({ description: GENERIC_ERROR, variant: 'error' }));
            }
            setIsLoading(false);
        },
        [isLoading, role, id, dispatch]
    );

    return { isLoading, getInvoiceData, getDocumentData };
};
