import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { downloadPayoutReceipt } from '../api';

export default function useDownloadPayoutReceiptApi() {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setLoading] = useState(false);

    const downloadReceipt = async (transactionId: number) => {
        setLoading(true);
        const res = await downloadPayoutReceipt(role, id, transactionId);
        setLoading(false);
        if ('pdfBuffer' in res) {
            const bytes = new Uint8Array(res.pdfBuffer.data);
            const blob = new Blob([bytes], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `payout-receipt-${transactionId}.pdf`;
            link.click();
            window.URL.revokeObjectURL(url);
            return true;
        }
        dispatch(showToast({ description: res.error, variant: 'error' }));
        return false;
    };

    return { downloadReceipt, isLoading };
}
