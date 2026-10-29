import { act, renderHook, waitFor } from '@testing-library/react';
import { saveAs } from 'file-saver';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { showToast } from '@src/slices/apiSlice';

import {
    cancelEWaybillApi,
    cancelIrnApi,
    downloadEInvoicePdfApi,
    getEInvoiceDetailsApi,
} from '../../../api/eInvoice';
import useEInvoiceDetails from '../../../hooks/eInvoiceDetails/useEInvoiceDetails';
import { mapEInvoiceApiToView } from '../../../utils/eInvoiceDetailsMapper';

vi.mock('../../../api/eInvoice', () => ({
    cancelEWaybillApi: vi.fn(),
    cancelIrnApi: vi.fn(),
    downloadEInvoicePdfApi: vi.fn(),
    getEInvoiceDetailsApi: vi.fn(),
}));

vi.mock('../../../utils/eInvoiceDetailsMapper', () => ({
    mapEInvoiceApiToView: vi.fn(),
}));

vi.mock('file-saver', () => ({
    saveAs: vi.fn(),
}));

const dispatchMock = vi.fn();
vi.mock('@src/hooks/hooks', () => ({
    useAppDispatch: () => dispatchMock,
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({ id: 'u1', role: 'admin' })),
}));

const baseDetail = {
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    eWaybill: null,
};

describe('useEInvoiceDetails', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetches and maps detail on mount', async () => {
        (getEInvoiceDetailsApi as Mock).mockResolvedValue({ raw: true });
        (mapEInvoiceApiToView as Mock).mockReturnValue(baseDetail);

        const { result } = renderHook(() => useEInvoiceDetails('inv-1'));

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(getEInvoiceDetailsApi).toHaveBeenCalledWith({
            userId: 'u1',
            userType: 'admin',
            invoiceId: 'inv-1',
        });
        expect(result.current.detail).toEqual(baseDetail);
    });

    it('exposes canCancelIrn=true when IRN active and within 24h', async () => {
        (getEInvoiceDetailsApi as Mock).mockResolvedValue({});
        (mapEInvoiceApiToView as Mock).mockReturnValue(baseDetail);
        const { result } = renderHook(() => useEInvoiceDetails('inv-1'));
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.canCancelIrn).toBe(true);
        expect(result.current.irnWindowExpired).toBe(false);
    });

    it('exposes irnWindowExpired=true when IRN older than 24h', async () => {
        (getEInvoiceDetailsApi as Mock).mockResolvedValue({});
        (mapEInvoiceApiToView as Mock).mockReturnValue({
            ...baseDetail,
            createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
        });
        const { result } = renderHook(() => useEInvoiceDetails('inv-1'));
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.canCancelIrn).toBe(false);
        expect(result.current.irnWindowExpired).toBe(true);
    });

    it('cancels IRN and shows success toast', async () => {
        (getEInvoiceDetailsApi as Mock).mockResolvedValue({});
        (mapEInvoiceApiToView as Mock).mockReturnValue(baseDetail);
        (cancelIrnApi as Mock).mockResolvedValue({ status: true });

        const { result } = renderHook(() => useEInvoiceDetails('inv-1'));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            await result.current.cancelIrn({ cancelReason: '1', remarks: 'r' });
        });

        expect(cancelIrnApi).toHaveBeenCalledWith({
            userId: 'u1',
            userType: 'admin',
            invoiceId: 'inv-1',
            cancelReason: '1',
            cancelRemark: 'r',
        });
        expect(dispatchMock).toHaveBeenCalledWith(
            showToast({ description: 'IRN cancelled successfully', variant: 'success' })
        );
    });

    it('shows error toast when cancel IRN fails', async () => {
        (getEInvoiceDetailsApi as Mock).mockResolvedValue({});
        (mapEInvoiceApiToView as Mock).mockReturnValue(baseDetail);
        (cancelIrnApi as Mock).mockResolvedValue({ status: false, message: 'no' });

        const { result } = renderHook(() => useEInvoiceDetails('inv-1'));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            await result.current.cancelIrn({ cancelReason: '1', remarks: 'r' });
        });

        expect(dispatchMock).toHaveBeenCalledWith(
            showToast({ description: 'no', variant: 'error' })
        );
    });

    it('downloads PDF using base64 string buffer', async () => {
        (getEInvoiceDetailsApi as Mock).mockResolvedValue({});
        (mapEInvoiceApiToView as Mock).mockReturnValue(baseDetail);
        (downloadEInvoicePdfApi as Mock).mockResolvedValue({ pdfBuffer: btoa('hi') });

        const { result } = renderHook(() => useEInvoiceDetails('inv-1'));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            await result.current.downloadPdf();
        });

        expect(saveAs).toHaveBeenCalledWith(expect.any(Blob), 'e-invoice-inv-1.pdf');
    });

    it('shows error toast when PDF download fails', async () => {
        (getEInvoiceDetailsApi as Mock).mockResolvedValue({});
        (mapEInvoiceApiToView as Mock).mockReturnValue(baseDetail);
        (downloadEInvoicePdfApi as Mock).mockResolvedValue(null);

        const { result } = renderHook(() => useEInvoiceDetails('inv-1'));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            await result.current.downloadPdf();
        });

        expect(dispatchMock).toHaveBeenCalledWith(
            showToast({ description: 'Failed to download PDF', variant: 'error' })
        );
    });

    it('cancels active E-Waybill on success', async () => {
        (getEInvoiceDetailsApi as Mock).mockResolvedValue({});
        (mapEInvoiceApiToView as Mock).mockReturnValue({
            ...baseDetail,
            eWaybill: { id: 'ewb-1', status: 'ACTIVE', createdAt: new Date().toISOString() },
        });
        (cancelEWaybillApi as Mock).mockResolvedValue({ status: true });

        const { result } = renderHook(() => useEInvoiceDetails('inv-1'));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            await result.current.cancelEWaybill({ cancelReason: '2' });
        });

        expect(cancelEWaybillApi).toHaveBeenCalledWith({
            userId: 'u1',
            userType: 'admin',
            invoiceId: 'ewb-1',
            cancelReason: '2',
        });
        expect(dispatchMock).toHaveBeenCalledWith(
            showToast({ description: 'E-Waybill cancelled successfully', variant: 'success' })
        );
    });
});
