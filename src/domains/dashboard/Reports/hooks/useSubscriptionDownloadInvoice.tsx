import { useState, useCallback } from 'react';

import { saveAs } from 'file-saver';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { subsciptionDownloadInvoice } from '../api/index';
import { downloadResponse } from '../types/index';

const GENERIC_ERROR =
    'Something went wrong. If the issue persists, please contact support at reach@peko.one';

// PDF files start with the "%PDF" signature; reject anything else so a
// placeholder/corrupt buffer is never saved to disk as a .pdf.
const isPdf = (bytes: Uint8Array) =>
    bytes.length >= 4 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46;

export const useSubscriptionDownloadInvoice = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [loadingTxnId, setLoadingTxnId] = useState<number | null>(null);
    const [loadingType, setLoadingType] = useState<'invoice' | 'receipt' | null>(null);

    const getInvoiceData = useCallback(
        async (transactionID: number, type: 'invoice' | 'receipt' = 'receipt') => {
            setLoadingTxnId(transactionID);
            setLoadingType(type);
            try {
                const data: downloadResponse | false = await subsciptionDownloadInvoice({
                    userId: id,
                    userType: role,
                    transactionID,
                    type,
                });

                const bytes = data ? new Uint8Array(data.pdfBuffer.data) : null;

                if (!bytes || !isPdf(bytes)) {
                    dispatch(showToast({ description: GENERIC_ERROR, variant: 'error' }));
                    return;
                }

                const blob = new Blob([bytes], { type: 'application/pdf' });
                const invoiceLabel = (data && data.label) || 'Invoice';
                saveAs(blob, `${type === 'invoice' ? invoiceLabel : 'Receipt'}-${transactionID}.pdf`);

                // An order can carry both the plan invoice and the platform fee invoice — download both.
                if (data && Array.isArray(data.additionalInvoices)) {
                    data.additionalInvoices.forEach(extra => {
                        const extraBytes = new Uint8Array(extra.pdfBuffer.data);
                        if (!isPdf(extraBytes)) return;
                        saveAs(
                            new Blob([extraBytes], { type: 'application/pdf' }),
                            `${extra.label}-${transactionID}.pdf`
                        );
                    });
                }
            } catch {
                dispatch(showToast({ description: GENERIC_ERROR, variant: 'error' }));
            } finally {
                // Always clears the per-row spinner, even on a malformed payload.
                setLoadingTxnId(null);
                setLoadingType(null);
            }
        },
        [id, role, dispatch]
    );

    return { loadingTxnId, loadingType, getInvoiceData };
};
