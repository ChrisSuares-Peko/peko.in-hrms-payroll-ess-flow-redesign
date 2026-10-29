import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { showToast } from '@src/slices/apiSlice';

import { getAllInvoices, getDashboardStats } from '../../api/invoices';
import useDashboardData from '../../hooks/useDashboardData';

vi.mock('../../api/invoices', () => ({
    getAllInvoices: vi.fn(),
    getDashboardStats: vi.fn(),
}));

const dispatchMock = vi.fn();

vi.mock('@src/hooks/hooks', () => ({
    useAppDispatch: () => dispatchMock,
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({ id: 'user123', role: 'admin' })),
}));

describe('useDashboardData', () => {
    const mockStats = { totalInvoices: 10, paid: 5, pending: 3, overdue: 2 };
    const mockInvoices = {
        invoiceData: [{ id: '1', invoiceNumber: 'INV-001' }],
        recordsTotal: 1,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should fetch stats and recent invoices on mount', async () => {
        (getDashboardStats as Mock).mockResolvedValue({ status: true, data: mockStats });
        (getAllInvoices as Mock).mockResolvedValue(mockInvoices);

        const { result } = renderHook(() => useDashboardData());

        await waitFor(() => expect(result.current.isStatsLoading).toBeFalsy());
        await waitFor(() => expect(result.current.isRecentInvoicesLoading).toBeFalsy());

        expect(getDashboardStats).toHaveBeenCalledWith({ userId: 'user123', userType: 'admin' });
        expect(result.current.stats).toEqual(mockStats);
        expect(result.current.recentInvoices).toEqual(mockInvoices.invoiceData);
    });

    it('should not update stats when API returns non-success', async () => {
        (getDashboardStats as Mock).mockResolvedValue({ status: false, message: 'error' });
        (getAllInvoices as Mock).mockResolvedValue(mockInvoices);

        const { result } = renderHook(() => useDashboardData());

        await waitFor(() => expect(result.current.isStatsLoading).toBeFalsy());
        expect(result.current.stats).toBeNull();
    });

    it('should show error toast when recent invoices fetch fails', async () => {
        (getDashboardStats as Mock).mockResolvedValue({ status: true, data: mockStats });
        (getAllInvoices as Mock).mockResolvedValue(false);

        renderHook(() => useDashboardData());

        await waitFor(() =>
            expect(dispatchMock).toHaveBeenCalledWith(
                showToast({
                    description: 'Something went wrong while fetching recent invoices.',
                    variant: 'error',
                })
            )
        );
    });
});
