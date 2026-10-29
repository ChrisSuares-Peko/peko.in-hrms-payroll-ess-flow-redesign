import { useCallback, useState } from 'react';

import { saveAs } from 'file-saver';

import { useAppSelector } from '@src/hooks/store';

import { downloadInvoice } from '../api/index';
import { downloadInvoiceResponse } from '../types/index';

export default function DownloadInvoiceData() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);

    const getInvoiceDetails = useCallback(
        async (invoiceId: string) => {
            setIsLoading(true);
            const data: downloadInvoiceResponse | false = await downloadInvoice({
                userId: id,
                userType: role,
                invoiceId,
            });
            if (data) {
                const payslip = data as downloadInvoiceResponse;
                const uint8Array = new Uint8Array(payslip.pdfBuffer.data);

                const blob = new Blob([uint8Array], { type: 'application/pdf' });

                saveAs(blob, 'Invoice.pdf');
            }
            setIsLoading(false);
        },
        [id, role]
    );

    return { loader: isLoading, getInvoiceDetails, isLoading };
}
