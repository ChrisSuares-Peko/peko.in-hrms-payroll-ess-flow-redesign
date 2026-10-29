import { renderHook, act, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { showToast } from '@src/slices/apiSlice';

import { deleteInvoiceApi, getAllInvoices, getDashboardStats } from '../../api/invoices';
import useInvoice from '../../hooks/useInvoice';

vi.mock('../../api/invoices', () => ({
    getAllInvoices: vi.fn(),
    deleteInvoiceApi: vi.fn(),
    getDashboardStats: vi.fn(),
}));

const dispatchMock = vi.fn();

vi.mock('@src/hooks/hooks', () => ({
    useAppDispatch: () => dispatchMock,
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({ id: 'user123', role: 'admin' })),
}));

describe('useInvoice', () => {
    const filters = {
        searchText: '',
        itemsPerPage: 10,
        page: 1,
        sort: 'DESC' as const,
        sortField: 'createdAt',
    };
    const mockInvoices = { invoiceData: [{ id: '1', invoiceNumber: 'INV-001' }], recordsTotal: 1 };
    const mockStats = { totalInvoices: 1, paid: 0, pending: 1, overdue: 0 };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should fetch invoice list and stats on mount', async () => {
        (getAllInvoices as Mock).mockResolvedValue(mockInvoices);
        (getDashboardStats as Mock).mockResolvedValue({ status: true, data: mockStats });

        const { result } = renderHook(() => useInvoice(filters));

        await waitFor(() => expect(result.current.isLoading).toBeFalsy());
        expect(result.current.invoiceList).toEqual(mockInvoices);
        expect(result.current.stats).toEqual(mockStats);
    });

    it('should show error toast when fetching invoices fails', async () => {
        (getAllInvoices as Mock).mockResolvedValue(false);
        (getDashboardStats as Mock).mockResolvedValue({ status: true, data: mockStats });

        renderHook(() => useInvoice(filters));

        await waitFor(() =>
            expect(dispatchMock).toHaveBeenCalledWith(
                showToast({
                    description: 'Something went wrong while fetching invoices.',
                    variant: 'error',
                })
            )
        );
    });

    it('should delete an invoice and show success toast', async () => {
        (getAllInvoices as Mock).mockResolvedValue(mockInvoices);
        (getDashboardStats as Mock).mockResolvedValue({ status: true, data: mockStats });
        (deleteInvoiceApi as Mock).mockResolvedValue({ status: true });

        const { result } = renderHook(() => useInvoice(filters));
        await waitFor(() => expect(result.current.isLoading).toBeFalsy());

        await act(async () => {
            await result.current.deleteInvoice('1');
        });

        expect(deleteInvoiceApi).toHaveBeenCalledWith({
            userId: 'user123',
            userType: 'admin',
            invoiceId: '1',
        });
        expect(dispatchMock).toHaveBeenCalledWith(
            showToast({ description: 'Invoice deleted successfully', variant: 'success' })
        );
    });

    it('should show error toast when delete API returns failure', async () => {
        (getAllInvoices as Mock).mockResolvedValue(mockInvoices);
        (getDashboardStats as Mock).mockResolvedValue({ status: true, data: mockStats });
        (deleteInvoiceApi as Mock).mockResolvedValue({ status: false, message: 'Cannot delete' });

        const { result } = renderHook(() => useInvoice(filters));
        await waitFor(() => expect(result.current.isLoading).toBeFalsy());

        await act(async () => {
            await result.current.deleteInvoice('1');
        });

        expect(dispatchMock).toHaveBeenCalledWith(
            showToast({ description: 'Cannot delete', variant: 'error' })
        );
    });
});
