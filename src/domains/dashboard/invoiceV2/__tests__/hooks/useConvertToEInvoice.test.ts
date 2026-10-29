import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { showToast } from '@src/slices/apiSlice';

import { getAllInvoices, getInvoiceById } from '../../api/invoices';
import useConvertToEInvoice from '../../hooks/useConvertToEInvoice';
import { setPrefilledIrn } from '../../slices/eInvoiceIrnSlice';

vi.mock('../../api/invoices', () => ({
    getAllInvoices: vi.fn(),
    getInvoiceById: vi.fn(),
}));

vi.mock('../../utils/mapInvoiceToIrn', () => ({
    mapInvoiceToIrn: vi.fn(() => ({ mapped: true })),
}));

const navigateMock = vi.fn();
vi.mock('react-router-dom', () => ({
    useNavigate: () => navigateMock,
}));

const dispatchMock = vi.fn();
vi.mock('@src/hooks/hooks', () => ({
    useAppDispatch: () => dispatchMock,
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({ id: 'u1', role: 'admin' })),
}));

const sampleInvoice = {
    id: 'inv-1',
    prefix: 'INV',
    invoiceNumber: '001',
    invoiceDate: '2026-05-01',
    name: 'Buyer',
    gstNumber: '29ABCDE1234F1Z5',
    totalAmount: 1000,
    status: 'PENDING',
};

describe('useConvertToEInvoice', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetches eligible invoices and maps rows', async () => {
        (getAllInvoices as Mock).mockResolvedValue({
            invoiceData: [sampleInvoice],
            recordsTotal: 1,
        });

        const { result } = renderHook(() => useConvertToEInvoice());

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.rows).toHaveLength(1);
        expect(result.current.rows[0].invoiceId).toBe('INV001');
        expect(result.current.totalRecords).toBe(1);
    });

    it('falls back to underscore when buyer gstin missing', async () => {
        (getAllInvoices as Mock).mockResolvedValue({
            invoiceData: [{ ...sampleInvoice, gstNumber: '' }],
            recordsTotal: 1,
        });
        const { result } = renderHook(() => useConvertToEInvoice());
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.rows[0].buyerGstin).toBe('_');
    });

    it('shows error toast when fetching invoices fails', async () => {
        (getAllInvoices as Mock).mockResolvedValue(null);

        renderHook(() => useConvertToEInvoice());
        await waitFor(() =>
            expect(dispatchMock).toHaveBeenCalledWith(
                showToast({ description: 'Failed to fetch invoices.', variant: 'error' })
            )
        );
    });

    it('dispatches prefilled IRN and navigates on row click', async () => {
        (getAllInvoices as Mock).mockResolvedValue({
            invoiceData: [sampleInvoice],
            recordsTotal: 1,
        });
        (getInvoiceById as Mock).mockResolvedValue({ details: true });

        const { result } = renderHook(() => useConvertToEInvoice());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            await result.current.handleRowClick(result.current.rows[0]);
        });

        expect(getInvoiceById).toHaveBeenCalledWith({
            userId: 'u1',
            userType: 'admin',
            invoiceId: 'inv-1',
        });
        expect(dispatchMock).toHaveBeenCalledWith(setPrefilledIrn({ mapped: true } as any));
        expect(navigateMock).toHaveBeenCalled();
    });

    it('shows error toast when row details fetch fails', async () => {
        (getAllInvoices as Mock).mockResolvedValue({
            invoiceData: [sampleInvoice],
            recordsTotal: 1,
        });
        (getInvoiceById as Mock).mockResolvedValue(null);

        const { result } = renderHook(() => useConvertToEInvoice());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            await result.current.handleRowClick(result.current.rows[0]);
        });

        expect(navigateMock).not.toHaveBeenCalled();
        expect(dispatchMock).toHaveBeenCalledWith(
            showToast({ description: 'Failed to load invoice details.', variant: 'error' })
        );
    });
});
