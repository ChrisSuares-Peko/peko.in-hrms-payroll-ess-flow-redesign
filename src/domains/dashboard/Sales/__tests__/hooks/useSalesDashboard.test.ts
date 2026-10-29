import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { getRecentTransactions, getSalesDashboard } from '../../api/dashboard';
import { getPaymentOnboardingStatus } from '../../api/onboarding';
import useSalesDashboard from '../../hooks/useSalesDashboard';

vi.mock('@src/hooks/store', () => ({ useAppSelector: vi.fn() }));
vi.mock('../../api/dashboard', () => ({
    getSalesDashboard: vi.fn(),
    getRecentTransactions: vi.fn(),
}));
vi.mock('../../api/onboarding', () => ({
    getPaymentOnboardingStatus: vi.fn(),
}));

beforeEach(() => {
    vi.clearAllMocks();
    (useAppSelector as any).mockReturnValue({ id: 'u', role: 'merchant' });
    (getPaymentOnboardingStatus as any).mockResolvedValue(null);
});

describe('useSalesDashboard', () => {
    it('hydrates dashboard data and recent transactions on mount', async () => {
        const dashboard = { totalSales: 1000, totalDocs: 12 };
        const transactions = [{ id: 't1', amount: 500 }];
        (getSalesDashboard as any).mockResolvedValueOnce(dashboard);
        (getRecentTransactions as any).mockResolvedValueOnce({
            recentTransactions: transactions,
            recordsTotal: 1,
        });

        const { result } = renderHook(() => useSalesDashboard());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(getSalesDashboard).toHaveBeenCalledWith({ userId: 'u', userType: 'merchant' });
        expect(getRecentTransactions).toHaveBeenCalledWith({
            userId: 'u',
            userType: 'merchant',
            page: 1,
            itemsPerPage: 5,
        });
        expect(result.current.data).toEqual(dashboard);
        expect(result.current.recentTransactions).toEqual(transactions);
    });

    it('keeps state defaults when both APIs return falsy', async () => {
        (getSalesDashboard as any).mockResolvedValueOnce(null);
        (getRecentTransactions as any).mockResolvedValueOnce(null);

        const { result } = renderHook(() => useSalesDashboard());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.data).toBeNull();
        expect(result.current.recentTransactions).toEqual([]);
    });
});
