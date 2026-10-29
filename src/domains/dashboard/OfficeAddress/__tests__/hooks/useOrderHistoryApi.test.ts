import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { getTransactionsApi } from '../../api/index';
import { useOrderHistoryApi } from '../../hooks/useOrderHistoryApi';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

vi.mock('../../api/index', () => ({
    getTransactionsApi: vi.fn(),
}));

describe('useOrderHistoryApi Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        (useAppSelector as any).mockImplementation((selectorFn: any) =>
            selectorFn({
                reducer: {
                    auth: { id: 1, role: 'user' },
                },
            })
        );
    });

    it('fetches and sets order history correctly', async () => {
        const mockResponse = {
            result: [
                {
                    id: '1',
                    transactionDate: '2024-02-10T12:00:00Z',
                    corporateTxnId: 'TXN123',
                    amountInINR: '1500',
                    workspaceOrderStatus: 'complete',
                    orderResponse: JSON.stringify({
                        planDetails: { name: 'Premium Plan', billingCycle: 'monthly' },
                    }),
                },
            ],
            totalData: 1,
        };

        (getTransactionsApi as any).mockResolvedValue(mockResponse);

        const { result } = renderHook(() =>
            useOrderHistoryApi({
                page: 1,
                itemsPerPage: 10,
                search: '',
                sort: 'DESC',
                fromDate: '2024-01-01',
                toDate: '2024-02-01',
            })
        );

        expect(result.current.isLoading).toBe(true);

        await act(async () => {});

        expect(getTransactionsApi).toHaveBeenCalledWith({
            userId: 1,
            userType: 'user',
            sort: 'DESC',
            page: 1,
            itemsPerPage: 10,
            search: '',
            fromDate: '2024-01-01',
            toDate: '2024-02-01',
        });

        expect(result.current.orders).toEqual([
            {
                key: '1',
                date: '2024-02-10T12:00:00Z',
                plan: 'Premium Plan',
                transactionId: 'TXN123',
                billingCycle: 'monthly',
                amount: '1500',
                status: 'complete',
            },
        ]);

        expect(result.current.count).toBe(1);
        expect(result.current.isLoading).toBe(false);
    });

    it('handles empty response gracefully', async () => {
        (getTransactionsApi as any).mockResolvedValue({ result: [], totalData: 0 });

        const { result } = renderHook(() =>
            useOrderHistoryApi({
                page: 1,
                itemsPerPage: 10,
                search: '',
                sort: 'DESC',
                fromDate: '2024-01-01',
                toDate: '2024-02-01',
            })
        );

        expect(result.current.isLoading).toBe(true);

        await act(async () => {});

        expect(result.current.orders).toEqual([]);
        expect(result.current.count).toBe(0);
        expect(result.current.isLoading).toBe(false);
    });

    it('handles API failure gracefully', async () => {
        (getTransactionsApi as any).mockResolvedValue(false);

        const { result } = renderHook(() =>
            useOrderHistoryApi({
                page: 1,
                itemsPerPage: 10,
                search: '',
                sort: 'DESC',
                fromDate: '2024-01-01',
                toDate: '2024-02-01',
            })
        );

        expect(result.current.isLoading).toBe(true);

        await act(async () => {});

        expect(result.current.orders).toEqual([]);
        expect(result.current.count).toBe(0);
        expect(result.current.isLoading).toBe(false);
    });
});
