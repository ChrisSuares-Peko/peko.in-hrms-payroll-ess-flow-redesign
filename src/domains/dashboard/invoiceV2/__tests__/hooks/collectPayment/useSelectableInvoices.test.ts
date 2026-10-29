import { renderHook, act, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { showToast } from '@src/slices/apiSlice';

import { getAllInvoices } from '../../../api/invoices';
import useSelectableInvoices from '../../../hooks/collectPayment/useSelectableInvoices';

vi.mock('../../../api/invoices', () => ({
    getAllInvoices: vi.fn(),
}));

const dispatchMock = vi.fn();

vi.mock('@src/hooks/hooks', () => ({
    useAppDispatch: () => dispatchMock,
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({ id: 'user123', role: 'admin' })),
}));

describe('useSelectableInvoices', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should not fetch when disabled', async () => {
        renderHook(() => useSelectableInvoices(false));
        await waitFor(() => expect(getAllInvoices).not.toHaveBeenCalled());
    });

    it('should fetch when enabled and populate state', async () => {
        (getAllInvoices as Mock).mockResolvedValue({
            invoiceData: [{ id: '1' }],
            recordsTotal: 5,
        });

        const { result } = renderHook(() => useSelectableInvoices(true));
        await waitFor(() => expect(result.current.isLoading).toBeFalsy());

        expect(result.current.invoices).toEqual([{ id: '1' }]);
        expect(result.current.totalRecords).toBe(5);
    });

    it('should show error toast when fetch fails', async () => {
        (getAllInvoices as Mock).mockResolvedValue(false);
        renderHook(() => useSelectableInvoices(true));

        await waitFor(() =>
            expect(dispatchMock).toHaveBeenCalledWith(
                showToast({
                    description: 'Something went wrong while fetching invoices.',
                    variant: 'error',
                })
            )
        );
    });

    it('should refetch when page changes', async () => {
        (getAllInvoices as Mock).mockResolvedValue({ invoiceData: [], recordsTotal: 0 });
        const { result } = renderHook(() => useSelectableInvoices(true));

        await waitFor(() => expect(getAllInvoices).toHaveBeenCalledTimes(1));

        act(() => {
            result.current.setPage(2);
        });

        await waitFor(() => expect(getAllInvoices).toHaveBeenCalledTimes(2));
    });
});
