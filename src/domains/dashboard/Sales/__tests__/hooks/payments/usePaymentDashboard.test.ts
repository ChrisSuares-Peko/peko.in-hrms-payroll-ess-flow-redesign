import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    getDueThisWeekApi,
    getPaymentDashboard,
    getRecentActivityApi,
    getTopCustomersApi,
} from '../../../api/payments';
import usePaymentDashboard from '../../../hooks/payments/usePaymentDashboard';

vi.mock('@src/hooks/hooks', () => ({ useAppDispatch: vi.fn() }));
vi.mock('@src/hooks/store', () => ({ useAppSelector: vi.fn() }));
vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn(payload => ({ type: 'apiSlice/showToast', payload })),
}));
vi.mock('../../../api/payments', () => ({
    getPaymentDashboard: vi.fn(),
    getDueThisWeekApi: vi.fn(),
    getTopCustomersApi: vi.fn(),
    getRecentActivityApi: vi.fn(),
}));

const mockDispatch = vi.fn();

beforeEach(() => {
    vi.clearAllMocks();
    (useAppSelector as any).mockReturnValue({ id: 'u', role: 'merchant' });
    (useAppDispatch as any).mockReturnValue(mockDispatch);
});

describe('usePaymentDashboard', () => {
    it('populates overview and detail buckets on success', async () => {
        const overview = { totalCollected: 1000, totalDue: 500 };
        (getPaymentDashboard as any).mockResolvedValueOnce(overview);
        (getDueThisWeekApi as any).mockResolvedValueOnce({
            dueThisWeek: [{ id: '1', name: 'Acme', dueDate: '2026-01-10', amountDue: 100 }],
            recordsTotal: 1,
        });
        (getTopCustomersApi as any).mockResolvedValueOnce({
            topCustomers: [{ name: 'A', totalPaid: '500' }],
        });
        (getRecentActivityApi as any).mockResolvedValueOnce({
            recentActivity: [
                {
                    customerName: 'B',
                    label: 'Paid',
                    amount: 200,
                    timestamp: new Date().toISOString(),
                },
            ],
            recordsTotal: 1,
        });

        const { result } = renderHook(() => usePaymentDashboard());

        await waitFor(() => expect(result.current.overView).toEqual(overview));

        expect(result.current.dueData).toEqual([
            { id: '1', name: 'Acme', dueDate: '2026-01-10', amount: 100 },
        ]);
        expect(result.current.topCustomers).toEqual([{ id: 1, name: 'A', totalRevenue: 500 }]);
        expect(result.current.recentActivity[0]).toMatchObject({
            id: 1,
            name: 'B',
            subtitle: 'Paid',
            amount: 200,
        });
        expect(typeof result.current.recentActivity[0].time).toBe('string');
    });

    it('shows error toast when overview API returns falsy', async () => {
        (getPaymentDashboard as any).mockResolvedValueOnce(null);
        (getDueThisWeekApi as any).mockResolvedValueOnce(null);
        (getTopCustomersApi as any).mockResolvedValueOnce(null);
        (getRecentActivityApi as any).mockResolvedValueOnce(null);

        renderHook(() => usePaymentDashboard());

        await waitFor(() =>
            expect(showToast).toHaveBeenCalledWith({
                description: 'Something went wrong while fetching payment data.',
                variant: 'error',
            })
        );
    });

    it('keeps detail buckets empty when details API returns falsy', async () => {
        (getPaymentDashboard as any).mockResolvedValueOnce({ totalCollected: 0 });
        (getDueThisWeekApi as any).mockResolvedValueOnce(false);
        (getTopCustomersApi as any).mockResolvedValueOnce(false);
        (getRecentActivityApi as any).mockResolvedValueOnce(null);

        const { result } = renderHook(() => usePaymentDashboard());

        await waitFor(() => expect(result.current.overView).not.toBeNull());

        expect(result.current.dueData).toEqual([]);
        expect(result.current.topCustomers).toEqual([]);
        expect(result.current.recentActivity).toEqual([]);
    });
});
