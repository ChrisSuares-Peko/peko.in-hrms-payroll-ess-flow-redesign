import { renderHook, act } from '@testing-library/react';
import { saveAs } from 'file-saver';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { showToast } from '@src/slices/apiSlice';

import { downloadInvoice } from '../../api/index';
import { useDownloadInvoice } from '../../hooks/useDownloadInvoice';

// A buffer starting with the "%PDF" signature (0x25 0x50 0x44 0x46).
const PDF_BYTES = [0x25, 0x50, 0x44, 0x46, 0x2d];

const dispatch = vi.fn();

// Mocking dependencies
vi.mock('../../api/index', () => ({
    downloadInvoice: vi.fn(),
}));

vi.mock('file-saver', () => ({
    saveAs: vi.fn(),
}));

vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn(payload => ({ type: 'showToast', payload })),
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({ role: 'admin', id: 123 })),
    useAppDispatch: () => dispatch,
}));

describe('useDownloadInvoice Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should set loading to true, call API, and save a valid PDF', async () => {
        const mockResponse = {
            pdfBuffer: { data: PDF_BYTES },
        };

        (downloadInvoice as any).mockResolvedValue(mockResponse);

        const { result } = renderHook(() => useDownloadInvoice());

        await act(async () => {
            result.current.getInvoiceData(456);
        });

        expect(result.current.loadingTxnId).toBeNull();
        expect(downloadInvoice).toHaveBeenCalledWith({
            userId: 123,
            userType: 'admin',
            transactionID: 456,
        });
        expect(saveAs).toHaveBeenCalled();
    });

    it('should save the invoice as the platform fee invoice and the receipt as a receipt', async () => {
        (downloadInvoice as any).mockResolvedValue({ pdfBuffer: { data: PDF_BYTES } });
        const { result } = renderHook(() => useDownloadInvoice());

        await act(async () => {
            await result.current.getInvoiceData(456, 'invoice');
        });
        await act(async () => {
            await result.current.getInvoiceData(456, 'receipt');
        });

        expect((saveAs as any).mock.calls.map((call: unknown[]) => call[1])).toEqual([
            'Invoice-on-Platform-Fee-456.pdf',
            'Receipt-456.pdf',
        ]);
    });

    it('should name the invoice by the label the server sends', async () => {
        (downloadInvoice as any).mockResolvedValue({ pdfBuffer: { data: PDF_BYTES }, label: 'Invoice' });
        const { result } = renderHook(() => useDownloadInvoice());

        await act(async () => {
            await result.current.getInvoiceData(456, 'invoice');
        });

        expect((saveAs as any).mock.calls.map((call: unknown[]) => call[1])).toEqual(['Invoice-456.pdf']);
    });

    it('should toast and not save when the API fails', async () => {
        (downloadInvoice as any).mockResolvedValue(false);

        const { result } = renderHook(() => useDownloadInvoice());

        await act(async () => {
            await result.current.getInvoiceData(789);
        });

        expect(downloadInvoice).toHaveBeenCalledWith({
            userId: 123,
            userType: 'admin',
            transactionID: 789,
        });
        expect(saveAs).not.toHaveBeenCalled();
        expect(showToast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'error' }));
        expect(result.current.loadingTxnId).toBeNull();
    });

    it('should toast and not save a non-PDF (corrupt) buffer', async () => {
        (downloadInvoice as any).mockResolvedValue({ pdfBuffer: { data: [1, 2, 3, 4] } });

        const { result } = renderHook(() => useDownloadInvoice());

        await act(async () => {
            await result.current.getInvoiceData(321);
        });

        expect(saveAs).not.toHaveBeenCalled();
        expect(showToast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'error' }));
        expect(result.current.loadingTxnId).toBeNull();
    });

    it('should clear the spinner even when the buffer is malformed', async () => {
        // data without pdfBuffer.data throws inside the hook; finally must still clear.
        (downloadInvoice as any).mockResolvedValue({});

        const { result } = renderHook(() => useDownloadInvoice());

        await act(async () => {
            await result.current.getInvoiceData(999);
        });

        expect(saveAs).not.toHaveBeenCalled();
        expect(result.current.loadingTxnId).toBeNull();
    });

    it('should set loader state correctly during API call', async () => {
        (downloadInvoice as any).mockImplementation(
            () =>
                new Promise(resolve =>
                    setTimeout(() => resolve({ pdfBuffer: { data: PDF_BYTES } }), 1000)
                )
        );

        const { result } = renderHook(() => useDownloadInvoice());

        act(() => {
            result.current.getInvoiceData(123);
        });

        expect(result.current.loadingTxnId).toBe(123); // loadingTxnId should be set immediately

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulating API delay
        });

        expect(result.current.loadingTxnId).toBeNull();
    });
});
