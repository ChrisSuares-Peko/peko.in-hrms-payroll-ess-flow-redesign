import { useState, useEffect, useCallback } from 'react';

import { saveAs } from 'file-saver';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    ManualPaymentRecord,
    deleteInvoicePaymentApi,
    downloadCreditNotePdfApi,
    downloadInvoicePdfApi,
    downloadManualPaymentReceiptApi,
    getAllCreditNotesApi,
    getInvoiceById,
    getInvoicePaymentsApi,
    recordManualPaymentApi,
    sendInvoiceEmailApi,
    sendManualPaymentReceiptEmailApi,
    updateCreditNoteStatusApi,
} from '../../api/invoices';
import { getProfileCompanyApi } from '../../api/settings';
import { CreditNoteRow } from '../../types/creditNote';
import { GetInvoiceByIdResponse } from '../../types/invoice';

const getPdfBufferData = (data: any): number[] | undefined =>
    data?.pdfBuffer?.data ?? data?.buffer?.data;

const useInvoiceDetails = (id?: string) => {
    const { id: userId, role } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [invoiceData, setInvoiceData] = useState<GetInvoiceByIdResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isDownloadingCreditNote, setIsDownloadingCreditNote] = useState(false);
    const [isDownloadingReceipt, setIsDownloadingReceipt] = useState(false);
    const [isSharingReceipt, setIsSharingReceipt] = useState(false);
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [pdfPreview, setPdfPreview] = useState<string | null>(null);
    const [invoiceHtml, setInvoiceHtml] = useState<string | null>(null);
    const [paymentHistory, setPaymentHistory] = useState<ManualPaymentRecord[]>([]);
    const [creditNotes, setCreditNotes] = useState<CreditNoteRow[]>([]);
    const [billerName, setBillerName] = useState('');
    const fetchPayments = useCallback(
        async (invoiceId: string) => {
            const data = await getInvoicePaymentsApi({ userId, userType: role, invoiceId });
            if (data) setPaymentHistory(data);
        },
        [userId, role]
    );

    const fetchCreditNotes = useCallback(
        async (invoiceId: string) => {
            const result = await getAllCreditNotesApi({
                userId,
                userType: role,
                linkedInvoiceId: invoiceId,
            });
            if (result) setCreditNotes(result.creditNotes);
        },
        [userId, role]
    );

    const updateCreditNoteStatus = useCallback(
        async (creditNoteId: string, status: 'PENDING' | 'REFUNDED'): Promise<boolean> => {
            const resp = await updateCreditNoteStatusApi({
                userId,
                userType: role,
                invoiceId: creditNoteId,
                status,
            });
            if (resp && resp.status) {
                if (id) fetchCreditNotes(id);
                return true;
            }
            dispatch(
                showToast({
                    description: (resp as any)?.message || 'Failed to update credit note status.',
                    variant: 'error',
                })
            );
            return false;
        },
        [id, userId, role, dispatch, fetchCreditNotes]
    );

    const fetchInvoice = useCallback(() => {
        if (!id) return;
        setIsLoading(true);
        setIsPreviewLoading(true);
        setInvoiceData(null);
        setPdfPreview(prev => {
            if (prev) URL.revokeObjectURL(prev);
            return null;
        });

        getInvoiceById({ userId, userType: role, invoiceId: id }).then(data => {
            if (!data) {
                dispatch(
                    showToast({ description: 'Failed to load invoice details.', variant: 'error' })
                );
            } else {
                setInvoiceData(data);
                if ((data as any).invoiceHtml) {
                    setInvoiceHtml((data as any).invoiceHtml);
                }
            }
            setIsLoading(false);
            setIsPreviewLoading(false);
        });

        fetchPayments(id);
        fetchCreditNotes(id);

        getProfileCompanyApi({ userId, userType: role }).then(company => {
            if (company) setBillerName(company.name || '');
        });
    }, [id, userId, role, dispatch, fetchPayments, fetchCreditNotes]);

    const downloadPdf = useCallback(
        async (invoiceId?: string, fileName?: string) => {
            if (!invoiceId) return;
            setIsDownloading(true);
            const resp = await downloadInvoicePdfApi({
                userId,
                userType: role,
                invoiceId,
                type: 'download',
            });
            if (resp && resp.status) {
                const bufferData = getPdfBufferData(resp.data);
                if (!bufferData) {
                    setIsDownloading(false);
                    return;
                }
                const arrayBuffer = new Uint8Array(bufferData);
                const blob = new Blob([arrayBuffer], {
                    type: resp.data.fileType || 'application/pdf',
                });
                saveAs(blob, fileName ?? `invoice-${invoiceId}.pdf`);
            } else if (resp && !resp.status) {
                dispatch(showToast({ description: resp.message, variant: 'error' }));
            }
            setIsDownloading(false);
        },
        [userId, role, dispatch]
    );

    const downloadCreditNotePdf = useCallback(
        async (invoiceId?: string) => {
            if (!invoiceId) return;
            setIsDownloadingCreditNote(true);
            const resp = await downloadCreditNotePdfApi({ userId, userType: role, invoiceId });
            if (resp && resp.status) {
                const bufferData = getPdfBufferData(resp.data);
                if (!bufferData) {
                    setIsDownloadingCreditNote(false);
                    return;
                }
                const arrayBuffer = new Uint8Array(bufferData);
                const blob = new Blob([arrayBuffer], {
                    type: resp.data?.fileType || 'application/pdf',
                });
                saveAs(blob, `CreditNote-${invoiceId}.pdf`);
            } else if (resp && !resp.status) {
                dispatch(showToast({ description: resp.message, variant: 'error' }));
            }
            setIsDownloadingCreditNote(false);
        },
        [userId, role, dispatch]
    );

    const addPayment = useCallback(
        async (values: {
            amount: number;
            paymentMethod: string;
            paymentDate: string;
            referenceId?: string;
            notes?: string;
        }): Promise<boolean> => {
            if (!id) return false;
            const resp = await recordManualPaymentApi({
                userId,
                userType: role,
                invoiceId: id,
                ...values,
            });
            if (resp && resp.status) {
                dispatch(
                    showToast({ description: 'Payment recorded successfully.', variant: 'success' })
                );
                fetchInvoice();
                return true;
            }
            if (resp && !resp.status) {
                dispatch(
                    showToast({
                        description: (resp as any).message || 'Failed to record payment.',
                        variant: 'error',
                    })
                );
            }
            return false;
        },
        [id, userId, role, dispatch, fetchInvoice]
    );

    const deletePayment = useCallback(
        async (paymentId: number): Promise<boolean> => {
            if (!id) return false;
            const resp = await deleteInvoicePaymentApi({
                userId,
                userType: role,
                invoiceId: id,
                paymentId,
            });
            if (resp && resp.status) {
                dispatch(
                    showToast({ description: 'Payment deleted successfully.', variant: 'success' })
                );
                fetchInvoice();
                return true;
            }
            if (resp && !resp.status) {
                dispatch(
                    showToast({
                        description: (resp as any).message || 'Failed to delete payment.',
                        variant: 'error',
                    })
                );
            }
            return false;
        },
        [id, userId, role, dispatch, fetchInvoice]
    );

    const downloadReceipt = useCallback(
        async (paymentId: number): Promise<boolean> => {
            if (!id) return false;
            setIsDownloadingReceipt(true);
            const result = await downloadManualPaymentReceiptApi({
                userId,
                userType: role,
                invoiceId: id,
                paymentId,
            });
            setIsDownloadingReceipt(false);
            if (result) {
                const bufferData = getPdfBufferData(result);
                if (!bufferData) {
                    dispatch(
                        showToast({ description: 'Failed to download receipt.', variant: 'error' })
                    );
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
            const result = await sendManualPaymentReceiptEmailApi({
                userId,
                userType: role,
                invoiceId: id,
                paymentId,
            });
            setIsSharingReceipt(false);
            if (result.success) {
                dispatch(
                    showToast({
                        description: 'Receipt sent to customer email.',
                        variant: 'success',
                    })
                );
                return true;
            }
            dispatch(
                showToast({
                    description: result.message || 'Failed to send receipt email.',
                    variant: 'error',
                })
            );
            return false;
        },
        [id, userId, role, dispatch]
    );

    const sendEmail = useCallback(
        async (invoiceId?: string, email?: string) => {
            if (!invoiceId) return;
            setIsSendingEmail(true);
            const resp = await sendInvoiceEmailApi({ userId, userType: role, invoiceId, email });
            if (resp && resp.status) {
                dispatch(
                    showToast({ description: 'Email sent successfully.', variant: 'success' })
                );
            } else if (resp && !resp.status) {
                dispatch(showToast({ description: resp.message, variant: 'error' }));
            }
            setIsSendingEmail(false);
        },
        [userId, role, dispatch]
    );

    useEffect(() => {
        fetchInvoice();
    }, [fetchInvoice]);

    useEffect(
        () => () => {
            if (pdfPreview) {
                URL.revokeObjectURL(pdfPreview);
            }
        },
        [pdfPreview]
    );

    return {
        invoiceData,
        isLoading,
        isPreviewLoading,
        downloadPdf,
        isDownloading,
        downloadCreditNotePdf,
        isDownloadingCreditNote,
        sendEmail,
        isSendingEmail,
        pdfUrl: pdfPreview,
        invoiceHtml,
        paymentHistory,
        creditNotes,
        addPayment,
        deletePayment,
        updateCreditNoteStatus,
        downloadReceipt,
        shareReceipt,
        isDownloadingReceipt,
        isSharingReceipt,
        billerName,
    };
};

export default useInvoiceDetails;
