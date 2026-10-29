import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { getTransactionsApi } from '../../api/orderHistory';
import { useOrderHistoryApi } from '../../hooks/useOrderHistoryApi';

vi.mock('../../api/orderHistory', () => ({
    getTransactionsApi: vi.fn(),
}));
vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

describe('useOrderHistoryApi hook', () => {
    const mockApiResponse = {
        totalData: 2,
        result: [
            {
                order: {
                    id: 'order123',
                    orderResponse: JSON.stringify({
                        planDetails: {
                            name: 'Basic Plan',
                            work: { name: 'Project A' },
                        },
                    }),
                    amountInINR: 1000,
                    transactionDate: '2024-01-01',
                    workspaceOrderStatus: 'Completed',
                    corporateTxnId: 'txn_abc123',
                },
            },
            {
                order: {
                    id: 'order456',
                    orderResponse: JSON.stringify({
                        planDetails: {
                            name: 'Pro Plan',
                            work: { name: 'Project B' },
                        },
                    }),
                    amountInINR: 2000,
                    transactionDate: '2024-01-02',
                    workspaceOrderStatus: 'Pending',
                    corporateTxnId: 'txn_def456',
                },
            },
        ],
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as Mock).mockReturnValue({ id: 'user123', role: 'admin' });
    });

    it('should start with loading state', () => {
        const { result } = renderHook(() =>
            useOrderHistoryApi({
                from: '2024-01-01',
                to: '2024-01-31',
                itemsPerPage: 10,
                page: 1,
                searchText: '',
                sort: 'ASC',
            })
        );

        expect(result.current.isLoading).toBe(true);
        expect(result.current.orders).toEqual([]);
        expect(result.current.count).toBeUndefined();
    });

    it('should fetch order history and update state on success', async () => {
        (getTransactionsApi as Mock).mockResolvedValue(mockApiResponse);

        const { result } = renderHook(() =>
            useOrderHistoryApi({
                from: '2024-01-01',
                to: '2024-01-31',
                itemsPerPage: 10,
                page: 1,
                searchText: '',
                sort: 'DESC',
            })
        );

        await act(async () => {
            await result.current;
        });

        expect(getTransactionsApi).toHaveBeenCalledWith({
            userId: 'user123',
            userType: 'admin',
            from: '2024-01-01',
            to: '2024-01-31',
            itemsPerPage: 10,
            page: 1,
            searchText: '',
            sort: 'DESC',
        });

        expect(result.current.orders).toEqual([
            {
                id: 'order123',
                planName: 'Basic Plan',
                workName: 'Project A',
                amount: 1000,
                date: '2024-01-01',
                status: 'Completed',
                transactionId: 'txn_abc123',
            },
            {
                id: 'order456',
                planName: 'Pro Plan',
                workName: 'Project B',
                amount: 2000,
                date: '2024-01-02',
                status: 'Pending',
                transactionId: 'txn_def456',
            },
        ]);
        expect(result.current.count).toBe(2);
        expect(result.current.isLoading).toBe(false);
    });

    it('should handle API failure and set isLoading to false', async () => {
        (getTransactionsApi as Mock).mockResolvedValue(false);

        const { result } = renderHook(() =>
            useOrderHistoryApi({
                from: '2024-01-01',
                to: '2024-01-31',
                itemsPerPage: 10,
                page: 1,
                searchText: '',
                sort: 'DESC',
            })
        );

        await act(async () => {
            await result.current;
        });

        expect(result.current.orders).toEqual([]);
        expect(result.current.count).toBeUndefined();
        expect(result.current.isLoading).toBe(false);
    });
});
