import { useCallback, useEffect, useState } from 'react';

import { saveAs } from 'file-saver';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { cancelEWaybillApi, cancelIrnApi, downloadEInvoicePdfApi, getEInvoiceDetailsApi } from '../../api/eInvoice';
import {
    CancelEWaybillValues,
    CancelIrnValues,
    EInvoiceDetailView,
} from '../../types/eInvoiceDetails';
import { mapEInvoiceApiToView } from '../../utils/eInvoiceDetailsMapper';

const isWithin24h = (dateStr: string) =>
    Date.now() - new Date(dateStr).getTime() < 24 * 60 * 60 * 1000;

const useEInvoiceDetails = (invoiceId: string) => {
    const dispatch = useAppDispatch();
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const [detail, setDetail] = useState<EInvoiceDetailView | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [cancelIrnOpen, setCancelIrnOpen] = useState(false);
    const [cancelEWaybillOpen, setCancelEWaybillOpen] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    const fetchDetail = useCallback(async () => {
        setIsLoading(true);
        const data = await getEInvoiceDetailsApi({ userId: id, userType: role, invoiceId });
        setIsLoading(false);
        if (!data) return;
        setDetail(mapEInvoiceApiToView(data));
    }, [id, role, invoiceId]);

    useEffect(() => {
        fetchDetail();
    }, [fetchDetail]);

    const cancelIrn = async (values: CancelIrnValues) => {
        const resp = await cancelIrnApi({
            userId: id,
            userType: role,
            invoiceId,
            cancelReason: values.cancelReason,
            cancelRemark: values.remarks,
        });
        if (!resp?.status) {
            dispatch(showToast({ description: resp?.message || 'Failed to cancel IRN', variant: 'error' }));
            return;
        }
        dispatch(showToast({ description: 'IRN cancelled successfully', variant: 'success' }));
        setCancelIrnOpen(false);
        fetchDetail();
    };

    const downloadPdf = async () => {
        setIsDownloading(true);
        const data = await downloadEInvoicePdfApi({ userId: id, userType: role, invoiceId });
        setIsDownloading(false);
        if (!data) {
            dispatch(showToast({ description: 'Failed to download PDF', variant: 'error' }));
            return;
        }
        const buf = data.pdfBuffer;
        const bytes =
            typeof buf === 'string'
                ? Uint8Array.from(atob(buf), c => c.charCodeAt(0))
                : new Uint8Array((buf as { type: string; data: number[] }).data);
        const blob = new Blob([bytes], { type: 'application/pdf' });
        saveAs(blob, `e-invoice-${invoiceId}.pdf`);
    };

    const cancelEWaybill = async (values: CancelEWaybillValues) => {
        const ewbId = detail?.eWaybill?.id ?? '';
        const resp = await cancelEWaybillApi({
            userId: id,
            userType: role,
            invoiceId: ewbId,
            cancelReason: values.cancelReason,
        });
        if (!resp?.status) {
            dispatch(showToast({ description: resp?.message || 'Failed to cancel E-Waybill', variant: 'error' }));
            return;
        }
        dispatch(showToast({ description: 'E-Waybill cancelled successfully', variant: 'success' }));
        setCancelEWaybillOpen(false);
        fetchDetail();
    };

    const hasActiveEWaybill = detail?.eWaybill?.status === 'ACTIVE';
    const noActiveEWaybill = !detail?.eWaybill || detail.eWaybill.status === 'CANCELLED';
    const irnActive = detail?.status === 'ACTIVE';

    const canCancelIrn = irnActive && noActiveEWaybill && isWithin24h(detail?.createdAt ?? '');
    const irnWindowExpired = irnActive && noActiveEWaybill && !isWithin24h(detail?.createdAt ?? '');
    const canCancelEWaybill = hasActiveEWaybill && isWithin24h(detail?.eWaybill?.createdAt ?? '');
    const ewbWindowExpired = hasActiveEWaybill && !isWithin24h(detail?.eWaybill?.createdAt ?? '');

    return {
        detail,
        isLoading,
        downloadPdf,
        isDownloading,
        cancelIrnOpen,
        setCancelIrnOpen,
        cancelEWaybillOpen,
        setCancelEWaybillOpen,
        cancelIrn,
        cancelEWaybill,
        canCancelIrn,
        irnWindowExpired,
        canCancelEWaybill,
        ewbWindowExpired,
        hasActiveEWaybill,
        irnActive,
    };
};

export default useEInvoiceDetails;
