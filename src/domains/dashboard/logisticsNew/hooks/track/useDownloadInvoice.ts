import { useCallback, useState } from 'react';

import { saveAs } from 'file-saver';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { downloadInvoice } from '../../api';

export const useDownloadInvoice = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();

    const [isLoading, setIsLoading] = useState(false);

    const handleDownloadInvoice = useCallback(
        async (trackingNumber: string, amount: number) => {
            setIsLoading(true);

            const data: any | false = await downloadInvoice({
                userType: role,
                userId: id,
                trackingNumber,
                amount,
            });

            if (data) {
                const uint8Array = new Uint8Array(data.pdfBuffer.data);

                const blob = new Blob([uint8Array], { type: 'application/pdf' });

                saveAs(blob, `Invoice-${trackingNumber}.pdf`);
            } else {
                dispatch(
                    showToast({
                        description: 'Failed to download invoice.',
                        variant: 'error',
                    })
                );
            }

            setIsLoading(false);
            return data;
        },
        [id, role, dispatch]
    );

    return {
        isLoading,
        handleDownloadInvoice,
    };
};
