import { renderHook, act, waitFor } from '@testing-library/react';
import { saveAs } from 'file-saver';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { showToast } from '@src/slices/apiSlice';

import { downloadInvoicePdfApi, getInvoiceById } from '../../../api/invoices';
import useInvoiceDetails from '../../../hooks/invoiceDetails/useInvoiceDetails';

vi.mock('../../../api/invoices', () => ({
    downloadInvoicePdfApi: vi.fn(),
    getInvoiceById: vi.fn(),
}));

vi.mock('file-saver', () => ({
    saveAs: vi.fn(),
}));

const dispatchMock = vi.fn();

vi.mock('@src/hooks/hooks', () => ({
    useAppDispatch: () => dispatchMock,
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({ id: 'user123', role: 'admin' })),
}));

describe('useInvoiceDetails', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        URL.createObjectURL = vi.fn(() => 'blob:preview');
        URL.revokeObjectURL = vi.fn();
    });

    it('should be a no-op when no id is provided', async () => {
        const { result } = renderHook(() => useInvoiceDetails());
        await waitFor(() => expect(result.current.isLoading).toBeFalsy());
        expect(getInvoiceById).not.toHaveBeenCalled();
    });

    it('should fetch invoice and preview on mount when id is provided', async () => {
        (getInvoiceById as Mock).mockResolvedValue({ id: '1', invoiceNumber: 'INV-1' });
        (downloadInvoicePdfApi as Mock).mockResolvedValue({
            status: true,
            data: { pdfBuffer: { data: [1, 2, 3] }, fileType: 'application/pdf' },
        });

        const { result } = renderHook(() => useInvoiceDetails('1'));

        await waitFor(() => expect(result.current.isLoading).toBeFalsy());
        await waitFor(() => expect(result.current.isPreviewLoading).toBeFalsy());

        expect(result.current.invoiceData).toMatchObject({ id: '1' });
        expect(result.current.pdfUrl).toBe('blob:preview');
    });

    it('should show error toast when getInvoiceById fails', async () => {
        (getInvoiceById as Mock).mockResolvedValue(false);
        renderHook(() => useInvoiceDetails('1'));

        await waitFor(() =>
            expect(dispatchMock).toHaveBeenCalledWith(
                showToast({ description: 'Failed to load invoice details.', variant: 'error' })
            )
        );
    });

    it('should download pdf and call saveAs on success', async () => {
        (getInvoiceById as Mock).mockResolvedValue({ id: '1' });
        (downloadInvoicePdfApi as Mock).mockResolvedValue({
            status: true,
            data: { pdfBuffer: { data: [1, 2, 3] }, fileType: 'application/pdf' },
        });

        const { result } = renderHook(() => useInvoiceDetails('1'));
        await waitFor(() => expect(result.current.isLoading).toBeFalsy());

        await act(async () => {
            await result.current.downloadPdf('1');
        });

        expect(saveAs).toHaveBeenCalled();
    });

    it('should show error toast when download API returns failure', async () => {
        (getInvoiceById as Mock).mockResolvedValue({ id: '1' });
        (downloadInvoicePdfApi as Mock)
            .mockResolvedValueOnce({
                status: true,
                data: { pdfBuffer: { data: [1] } },
            })
            .mockResolvedValueOnce({ status: false, message: 'download failed' });

        const { result } = renderHook(() => useInvoiceDetails('1'));
        await waitFor(() => expect(result.current.isLoading).toBeFalsy());

        await act(async () => {
            await result.current.downloadPdf('1');
        });

        expect(dispatchMock).toHaveBeenCalledWith(
            showToast({ description: 'download failed', variant: 'error' })
        );
    });
});
