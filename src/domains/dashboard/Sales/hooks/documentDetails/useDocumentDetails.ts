import { useCallback, useEffect, useState } from 'react';

import { saveAs } from 'file-saver';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    deleteInvoicePaymentApi,
    downloadManualPaymentReceiptApi,
    getInvoicePaymentsApi,
    recordManualPaymentApi,
    sendManualPaymentReceiptEmailApi,
} from '../../api/collectPayment';
import { getAllCreditNotesApi } from '../../api/creditNotes';
import {
    downloadDocumentPdfApi,
    getDocumentById,
    sendDocumentEmail,
    updateDocumentStatus,
} from '../../api/documents';
import { getProfileCompanyApi } from '../../api/settings';
import { ManualPaymentRecord } from '../../types/CollectPayment';
import { CreditNoteRow } from '../../types/creditNote';
import { GetDocumentById } from '../../types/documentDetails';
import { DocumentType } from '../../types/documents';

const getPdfBufferData = (data: any): number[] | undefined =>
    data?.pdfBuffer?.data ?? data?.buffer?.data;

const useDocumentDetails = (id?: string, documentType: DocumentType = 'INVOICE') => {
    const { id: userId, role } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [documentData, setDocumentData] = useState<GetDocumentById | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [isMarkingComplete, setIsMarkingComplete] = useState(false);
    const [documentHtml, setDocumentHtml] = useState<string | null>(null);
    const [paymentHistory, setPaymentHistory] = useState<ManualPaymentRecord[]>([]);
    const [creditNotes, setCreditNotes] = useState<CreditNoteRow[]>([]);
    const [billerName, setBillerName] = useState('');
    const isInvoice = documentType === 'INVOICE';

    const fetchPayments = useCallback(
        async (invoiceId: string) => {
            const data = await getInvoicePaymentsApi({ userId, userType: role, invoiceId });
            if (data) setPaymentHistory(data);
        },
        [userId, role]
    );

    const fetchCreditNotes = useCallback(
        async (invoiceId: string) => {
            const result = await getAllCreditNotesApi({ userId, userType: role, linkedInvoiceId: invoiceId });
            if (result) setCreditNotes(result.creditNotes);
        },
        [userId, role]
    );

    const fetchDocument = useCallback(() => {
        if (!id) return;
        setIsLoading(true);
        setIsPreviewLoading(true);
        setDocumentHtml(null);

        getDocumentById({ userId, userType: role, documentId: id }).then(data => {
            if (!data) {
                dispatch(
                    showToast({ description: 'Failed to load document details.', variant: 'error' })
                );
            } else {
                const { invoiceType, invoiceNumber, invoiceDate, invoiceHtml, ...rest } = data;
                setDocumentData({
                    transactionType: invoiceType,
                    documentNumber: invoiceNumber,
                    documentDate: invoiceDate,
                    ...rest,
                });
                if (invoiceHtml) setDocumentHtml(invoiceHtml);
            }
            setIsLoading(false);
            setIsPreviewLoading(false);
        });

        if (isInvoice) {
            fetchPayments(id);
            fetchCreditNotes(id);
            getProfileCompanyApi({ userId, userType: role }).then(company => {
                if (company) setBillerName(company.name || '');
            });
        }
    }, [id, userId, role, dispatch, isInvoice, fetchPayments, fetchCreditNotes]);

    const downloadPdf = useCallback(
        async (documentId?: string) => {
            if (!documentId) return;
            setIsDownloading(true);
            const resp = await downloadDocumentPdfApi({
                userId,
                userType: role,
                documentId,
                type: 'download',
            });
            if (resp && resp.status) {
                const bufferData = getPdfBufferData(resp.data);
                if (!bufferData) {
                    setIsDownloading(false);
                    return;
                }
                const arrayBuffer = new Uint8Array(bufferData);
                const blob = new Blob([arrayBuffer], { type: resp.data.fileType || 'application/pdf' });
                saveAs(blob, `document-${documentId}.pdf`);
            } else if (resp && !resp.status) {
                dispatch(showToast({ description: resp.message, variant: 'error' }));
            }
            setIsDownloading(false);
        },
        [userId, role, dispatch]
    );

    const shareDocument = useCallback(
        async (documentId?: string, email?: string) => {
            if (!documentId) return;
            setIsSharing(true);
            const resp = await sendDocumentEmail({ userId, userType: role, documentId, email });
            if (resp && resp.status) {
                dispatch(showToast({ description: 'Email sent successfully', variant: 'success' }));
            } else if (resp && !resp.status) {
                dispatch(showToast({ description: resp.message, variant: 'error' }));
            } else {
                dispatch(showToast({ description: 'Failed to send email', variant: 'error' }));
            }
            setIsSharing(false);
        },
        [userId, role, dispatch]
    );

    const markAsCompleted = useCallback(
        async (documentId?: string) => {
            if (!documentId) return;
            setIsMarkingComplete(true);
            const resp = await updateDocumentStatus({
                userId,
                userType: role,
                documentId,
                status: 'COMPLETED',
            });
            if (resp && resp.status) {
                dispatch(
                    showToast({
                        description: 'Sales Order marked as completed',
                        variant: 'success',
                    })
                );
                fetchDocument();
            } else if (resp && !resp.status) {
                dispatch(showToast({ description: resp.message, variant: 'error' }));
            } else {
                dispatch(showToast({ description: 'Failed to update status', variant: 'error' }));
            }
            setIsMarkingComplete(false);
        },
        [userId, role, dispatch, fetchDocument]
    );

    // ─── Invoice-only manual payment history ────────────────────────────────

    const addPayment = useCallback(
        async (values: {
            amount: number;
            paymentMethod: string;
            paymentDate: string;
            referenceId?: string;
            notes?: string;
        }): Promise<boolean> => {
            if (!id) return false;
            const resp = await recordManualPaymentApi({ userId, userType: role, invoiceId: id, ...values });
            if (resp && resp.status) {
                dispatch(showToast({ description: 'Payment recorded successfully.', variant: 'success' }));
                fetchDocument();
                return true;
            }
            if (resp && !resp.status) {
                dispatch(showToast({ description: (resp as any).message || 'Failed to record payment.', variant: 'error' }));
            }
            return false;
        },
        [id, userId, role, dispatch, fetchDocument]
    );

    const deletePayment = useCallback(
        async (paymentId: number): Promise<boolean> => {
            if (!id) return false;
            const resp = await deleteInvoicePaymentApi({ userId, userType: role, invoiceId: id, paymentId });
            if (resp && resp.status) {
                dispatch(showToast({ description: 'Payment deleted successfully.', variant: 'success' }));
                fetchDocument();
                return true;
            }
            if (resp && !resp.status) {
                dispatch(showToast({ description: (resp as any).message || 'Failed to delete payment.', variant: 'error' }));
            }
            return false;
        },
        [id, userId, role, dispatch, fetchDocument]
    );

    const [isDownloadingReceipt, setIsDownloadingReceipt] = useState(false);
    const [isSharingReceipt, setIsSharingReceipt] = useState(false);

    const downloadReceipt = useCallback(
        async (paymentId: number): Promise<boolean> => {
            if (!id) return false;
            setIsDownloadingReceipt(true);
            const result = await downloadManualPaymentReceiptApi({ userId, userType: role, invoiceId: id, paymentId });
            setIsDownloadingReceipt(false);
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
        [id, userId, role, dispatch]
    );

    const shareReceipt = useCallback(
        async (paymentId: number): Promise<boolean> => {
            if (!id) return false;
            setIsSharingReceipt(true);
            const result = await sendManualPaymentReceiptEmailApi({ userId, userType: role, invoiceId: id, paymentId });
            setIsSharingReceipt(false);
            if (result.success) {
                dispatch(showToast({ description: 'Receipt sent to customer email.', variant: 'success' }));
                return true;
            }
            dispatch(showToast({ description: result.message || 'Failed to send receipt email.', variant: 'error' }));
            return false;
        },
        [id, userId, role, dispatch]
    );

    useEffect(() => {
        fetchDocument();
    }, [fetchDocument]);

    return {
        documentData,
        isLoading,
        isPreviewLoading,
        downloadPdf,
        isDownloading,
        shareDocument,
        isSharing,
        markAsCompleted,
        isMarkingComplete,
        documentHtml,
        paymentHistory,
        creditNotes,
        addPayment,
        deletePayment,
        downloadReceipt,
        shareReceipt,
        isDownloadingReceipt,
        isSharingReceipt,
        billerName,
    };
};

export default useDocumentDetails;
