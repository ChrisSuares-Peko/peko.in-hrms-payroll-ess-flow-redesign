import { useCallback, useEffect, useState } from 'react';

import { saveAs } from 'file-saver';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { downloadPaymentReceiptApi, getPaymentTransactionDetails } from '../api/payments';
import { PaymentDetailsData } from '../types/payments';

const usePaymentDetails = (transactionId?: string) => {
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [data, setData] = useState<PaymentDetailsData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    const fetchDetails = useCallback(async () => {
        if (!transactionId) return;
        setIsLoading(true);
        const result = await getPaymentTransactionDetails({ userId, userType, transactionId });
        if (result) {
            const { paymentLink, invoice } = result;
            setData({
                transactionId: paymentLink.transactionId,
                invoiceRef: invoice.invoiceNumber,
                paymentMethod: invoice.paymentMode,
                dateTime: paymentLink.dateTime,
                transactionRef: paymentLink.decentro_txn_id,
                status: paymentLink.status,
                amount: parseFloat(paymentLink.amount) || 0,
                notes: invoice.notes,
                customerName: invoice.name,
                customerPhone: invoice.phoneNumber,
                customerEmail: invoice.email,
                customerGst: invoice.gstNumber,
                customerAddress: [
                    invoice.address,
                    invoice.city,
                    invoice.state,
                ]
                    .filter(Boolean)
                    .join(', '),
                customerPincode: invoice.pincode,
                customerCountry: invoice.country,
                invoiceId: invoice.id,
                invoiceStatus: invoice.status,
                timeline: paymentLink.timeline ?? [],
            });
        }
        setIsLoading(false);
    }, [userId, userType, transactionId]);

    const downloadReceipt = useCallback(async () => {
        if (!data?.invoiceId) return;
        setIsDownloading(true);
        const result = await downloadPaymentReceiptApi({ userId, userType, invoiceId: data.invoiceId });
        const raw = result?.pdfBuffer ?? result?.buffer ?? result;
        let bufferData: number[] | null = null;
        if (Array.isArray(raw?.data)) {
            bufferData = raw.data;
        } else if (raw && typeof raw === 'object') {
            const values = Object.values(raw).filter((v): v is number => typeof v === 'number');
            if (values.length) bufferData = values;
        }
        if (bufferData?.length) {
            const bytes = new Uint8Array(bufferData);
            const blob = new Blob([bytes], { type: result?.fileType || 'application/pdf' });
            saveAs(blob, `receipt-${data.transactionId}.pdf`);
        } else {
            dispatch(showToast({ description: 'Failed to download receipt.', variant: 'error' }));
        }
        setIsDownloading(false);
    }, [userId, userType, data, dispatch]);

    useEffect(() => {
        fetchDetails();
    }, [fetchDetails]);

    return { data, isLoading, downloadReceipt, isDownloading };
};

export default usePaymentDetails;
