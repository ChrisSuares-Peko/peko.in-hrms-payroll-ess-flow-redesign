import { useCallback, useState } from 'react';

import { saveAs } from 'file-saver';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { downloadOrderDocument } from '../api/orderJournal';
import {
    OrderDocumentDownloadResponse,
    OrderDocumentRecipient,
    OrderDocumentType,
} from '../types/orderJournal';

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

const DOCUMENT_FILENAME: Record<string, string> = {
    'subscriber:invoice': 'Invoice-on-Platform-Fee',
    'subscriber:planInvoice': 'Invoice',
    'subscriber:receipt': 'Receipt',
    'vendor:invoice': 'Vendor-Invoice',
    'vendor:planInvoice': 'Copy-of-Invoice',
};

export const useDownloadOrderDocument = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [loadingKey, setLoadingKey] = useState<string | null>(null);

    const downloadDocument = useCallback(
        async (orderId: number, recipient: OrderDocumentRecipient, docType: OrderDocumentType) => {
            const key = `${orderId}:${recipient}:${docType}`;
            setLoadingKey(key);
            try {
                const data: OrderDocumentDownloadResponse | false = await downloadOrderDocument({
                    userId: id,
                    userType: role,
                    orderId,
                    recipient,
                    docType,
                });

                const bytes = data ? new Uint8Array(data.pdfBuffer.data) : null;

                if (!bytes || !isPdf(bytes)) {
                    dispatch(showToast({ description: GENERIC_ERROR, variant: 'error' }));
                    return;
                }

                const blob = new Blob([bytes], { type: 'application/pdf' });
                const filename = DOCUMENT_FILENAME[`${recipient}:${docType}`] ?? 'Document';
                saveAs(blob, `${filename}-${orderId}.pdf`);
            } catch {
                dispatch(showToast({ description: GENERIC_ERROR, variant: 'error' }));
            } finally {
                // Always clears the per-button spinner, even on a malformed payload.
                setLoadingKey(null);
            }
        },
        [id, role, dispatch]
    );

    return { loadingKey, downloadDocument };
};
