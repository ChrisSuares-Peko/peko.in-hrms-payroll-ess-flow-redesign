import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, beforeEach, beforeAll, expect } from 'vitest';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getInvoicePaymentsApi } from '../../../api/collectPayment';
import { getAllCreditNotesApi } from '../../../api/creditNotes';
import {
    downloadDocumentPdfApi,
    getDocumentById,
    sendDocumentEmail,
    updateDocumentStatus,
} from '../../../api/documents';
import { getProfileCompanyApi } from '../../../api/settings';
import useDocumentDetails from '../../../hooks/documentDetails/useDocumentDetails';

vi.mock('@src/hooks/hooks', () => ({ useAppDispatch: vi.fn() }));
vi.mock('@src/hooks/store', () => ({ useAppSelector: vi.fn() }));
vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn(payload => ({ type: 'apiSlice/showToast', payload })),
}));
vi.mock('../../../api/documents', () => ({
    getDocumentById: vi.fn(),
    downloadDocumentPdfApi: vi.fn(),
    sendDocumentEmail: vi.fn(),
    updateDocumentStatus: vi.fn(),
}));
vi.mock('../../../api/creditNotes', () => ({
    getAllCreditNotesApi: vi.fn(),
}));
vi.mock('../../../api/collectPayment', () => ({
    getInvoicePaymentsApi: vi.fn(),
    deleteInvoicePaymentApi: vi.fn(),
    downloadManualPaymentReceiptApi: vi.fn(),
    sendManualPaymentReceiptEmailApi: vi.fn(),
    recordManualPaymentApi: vi.fn(),
}));
vi.mock('../../../api/settings', () => ({
    getProfileCompanyApi: vi.fn(),
}));
vi.mock('file-saver', () => ({ saveAs: vi.fn() }));
vi.mock('pdfjs-dist/build/pdf.worker.min.mjs?url', () => ({ default: 'mock-worker-url' }));
vi.mock('pdfjs-dist', () => ({
    GlobalWorkerOptions: { workerSrc: '' },
    getDocument: vi.fn(() => ({
        promise: Promise.resolve({
            getPage: vi.fn(() =>
                Promise.resolve({
                    getViewport: vi.fn(() => ({ width: 100, height: 100 })),
                    render: vi.fn(() => ({ promise: Promise.resolve() })),
                })
            ),
        }),
    })),
}));

const mockDispatch = vi.fn();

beforeAll(() => {
    global.URL.createObjectURL = vi.fn(() => 'blob:mock');
    global.URL.revokeObjectURL = vi.fn();
});

beforeEach(() => {
    vi.clearAllMocks();
    (useAppSelector as any).mockReturnValue({ id: 'u', role: 'merchant' });
    (useAppDispatch as any).mockReturnValue(mockDispatch);
    (downloadDocumentPdfApi as any).mockResolvedValue(null);
    (getDocumentById as any).mockResolvedValue(null);
    // Invoice-only side-fetches (documentType defaults to 'INVOICE' below) —
    // give them harmless default resolutions so they don't affect assertions.
    (getAllCreditNotesApi as any).mockResolvedValue(false);
    (getInvoicePaymentsApi as any).mockResolvedValue(false);
    (getProfileCompanyApi as any).mockResolvedValue(null);
});

describe('useDocumentDetails', () => {
    it('skips fetch when id is undefined', async () => {
        const { result } = renderHook(() => useDocumentDetails(undefined));

        await waitFor(() => expect(getDocumentById).not.toHaveBeenCalled());
        expect(result.current.documentData).toBeNull();
    });

    it('fetches document and remaps invoice fields', async () => {
        (getDocumentById as any).mockResolvedValueOnce({
            invoiceType: 'DOMESTIC',
            invoiceNumber: '101',
            invoiceDate: '2026-01-01',
            name: 'Acme',
            totalAmount: '500',
        });

        const { result } = renderHook(() => useDocumentDetails('d-1'));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(getDocumentById).toHaveBeenCalledWith({
            userId: 'u',
            userType: 'merchant',
            documentId: 'd-1',
        });
        expect(result.current.documentData).toEqual({
            transactionType: 'DOMESTIC',
            documentNumber: '101',
            documentDate: '2026-01-01',
            name: 'Acme',
            totalAmount: '500',
        });
    });

    it('shows error toast when getDocumentById returns falsy', async () => {
        (getDocumentById as any).mockResolvedValueOnce(null);

        const { result } = renderHook(() => useDocumentDetails('d-1'));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(showToast).toHaveBeenCalledWith({
            description: 'Failed to load document details.',
            variant: 'error',
        });
        expect(result.current.documentData).toBeNull();
    });

    it('downloadPdf saves blob via saveAs on success', async () => {
        (getDocumentById as any).mockResolvedValueOnce(null);
        (downloadDocumentPdfApi as any).mockResolvedValueOnce({
            status: true,
            data: {
                pdfBuffer: { data: [1, 2, 3] },
                fileType: 'application/pdf',
            },
        });
        const { saveAs } = await import('file-saver');

        const { result } = renderHook(() => useDocumentDetails('d-1'));

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        (downloadDocumentPdfApi as any).mockResolvedValueOnce({
            status: true,
            data: {
                pdfBuffer: { data: [1, 2, 3] },
                fileType: 'application/pdf',
            },
        });

        await act(async () => {
            await result.current.downloadPdf('d-1');
        });

        expect(saveAs).toHaveBeenCalled();
        const [, filename] = (saveAs as any).mock.calls[0];
        expect(filename).toBe('document-d-1.pdf');
        expect(result.current.isDownloading).toBe(false);
    });

    it('downloadPdf shows error toast on failed status', async () => {
        (getDocumentById as any).mockResolvedValueOnce(null);

        const { result } = renderHook(() => useDocumentDetails('d-1'));

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        (showToast as any).mockClear();
        (downloadDocumentPdfApi as any).mockReset();
        (downloadDocumentPdfApi as any).mockImplementation(async () => ({
            status: false,
            message: 'no pdf',
        }));

        await act(async () => {
            await result.current.downloadPdf('d-1');
        });

        expect(downloadDocumentPdfApi).toHaveBeenCalled();
        expect(showToast).toHaveBeenCalledWith({ description: 'no pdf', variant: 'error' });
    });

    it('downloadPdf does nothing when documentId is missing', async () => {
        (getDocumentById as any).mockResolvedValueOnce(null);

        const { result } = renderHook(() => useDocumentDetails('d-1'));

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        (downloadDocumentPdfApi as any).mockClear();

        await act(async () => {
            await result.current.downloadPdf();
        });

        expect(downloadDocumentPdfApi).not.toHaveBeenCalled();
    });

    it('shareDocument shows success toast on status true', async () => {
        (getDocumentById as any).mockResolvedValueOnce(null);
        (sendDocumentEmail as any).mockResolvedValueOnce({ status: true });

        const { result } = renderHook(() => useDocumentDetails('d-1'));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            await result.current.shareDocument('d-1');
        });

        expect(sendDocumentEmail).toHaveBeenCalledWith({
            userId: 'u',
            userType: 'merchant',
            documentId: 'd-1',
        });
        expect(showToast).toHaveBeenCalledWith({
            description: 'Email sent successfully',
            variant: 'success',
        });
    });

    it('shareDocument shows API error message on status false', async () => {
        (getDocumentById as any).mockResolvedValueOnce(null);
        (sendDocumentEmail as any).mockResolvedValueOnce({ status: false, message: 'no email' });

        const { result } = renderHook(() => useDocumentDetails('d-1'));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            await result.current.shareDocument('d-1');
        });

        expect(showToast).toHaveBeenCalledWith({ description: 'no email', variant: 'error' });
    });

    it('shareDocument shows fallback error toast when API returns falsy', async () => {
        (getDocumentById as any).mockResolvedValueOnce(null);
        (sendDocumentEmail as any).mockResolvedValueOnce(null);

        const { result } = renderHook(() => useDocumentDetails('d-1'));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            await result.current.shareDocument('d-1');
        });

        expect(showToast).toHaveBeenCalledWith({
            description: 'Failed to send email',
            variant: 'error',
        });
    });

    it('markAsCompleted updates status and refetches on success', async () => {
        (getDocumentById as any).mockResolvedValue(null);
        (updateDocumentStatus as any).mockResolvedValueOnce({ status: true });

        const { result } = renderHook(() => useDocumentDetails('d-1'));

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        const initialFetches = (getDocumentById as any).mock.calls.length;

        await act(async () => {
            await result.current.markAsCompleted('d-1');
        });

        expect(updateDocumentStatus).toHaveBeenCalledWith({
            userId: 'u',
            userType: 'merchant',
            documentId: 'd-1',
            status: 'COMPLETED',
        });
        expect(showToast).toHaveBeenCalledWith({
            description: 'Sales Order marked as completed',
            variant: 'success',
        });
        await waitFor(() => {
            expect((getDocumentById as any).mock.calls.length).toBeGreaterThan(initialFetches);
        });
    });

    it('markAsCompleted shows error message on status false', async () => {
        (getDocumentById as any).mockResolvedValue(null);
        (updateDocumentStatus as any).mockResolvedValueOnce({ status: false, message: 'denied' });

        const { result } = renderHook(() => useDocumentDetails('d-1'));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            await result.current.markAsCompleted('d-1');
        });

        expect(showToast).toHaveBeenCalledWith({ description: 'denied', variant: 'error' });
    });
});
