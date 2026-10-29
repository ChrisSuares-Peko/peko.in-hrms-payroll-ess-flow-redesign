import { useCallback, useState } from 'react';

import { saveAs } from 'file-saver';

import { useAppSelector } from '@src/hooks/store';

import { downloadInvoice } from '../api';
import { downloadResponse } from '../types/types';

const MINIMUM_LOADING_TIME = 300;

export const useDownloadInvoice = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [loadingKey, setLoadingKey] = useState<string | null>(null);

    const getInvoiceData = useCallback(
        async (
            transactionID: string,
            rowId: string | number,
            type: 'invoice' | 'receipt' = 'receipt'
        ) => {
            const startedAt = Date.now();
            setLoadingKey(`${rowId}-${type}`);
            try {
                const data: downloadResponse | false = await downloadInvoice({
                    userId: id,
                    userType: role,
                    transactionID,
                    type,
                });

                if (data) {
                    const bytes = new Uint8Array(data.pdfBuffer.data);
                    const blob = new Blob([bytes], { type: 'application/pdf' });
                    saveAs(blob, `${type === 'invoice' ? 'Invoice' : 'Receipt'}-${transactionID}.pdf`);
                }
            } finally {
                const remainingTime = MINIMUM_LOADING_TIME - (Date.now() - startedAt);
                if (remainingTime > 0) {
                    await new Promise(resolve => setTimeout(resolve, remainingTime));
                }
                setLoadingKey(null);
            }
        },
        [id, role]
    );

    return { loadingKey, getInvoiceData };
};
