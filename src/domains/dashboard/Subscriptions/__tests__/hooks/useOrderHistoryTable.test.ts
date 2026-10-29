import { renderHook, act, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, Mock, test, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { getOrderHistoryTable } from '../../api/index';
import { useOrderHistoryTable } from '../../hooks/useOrderHistoryTable';
import { OrderHistoryListResponse } from '../../types/types';

// Mock modules

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

vi.mock('../../api/index', () => ({
    getOrderHistoryTable: vi.fn(),
}));

type DebouncedFunction = {
    (...args: any[]): void;
    cancel: () => void;
};

// Mock debounce from lodash
vi.mock('lodash', () => ({
    debounce: (fn: Function): DebouncedFunction => {
        const debouncedFn: DebouncedFunction = fn as DebouncedFunction;
        debouncedFn.cancel = vi.fn();
        return debouncedFn;
    },
}));

describe('useOrderHistoryTable', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Mock implementation for useAppSelector
        (useAppSelector as Mock).mockReturnValue({
            reducer: {
                auth: { role: 'user', id: '123' },
            },
        });
        cleanup();
    });

    afterEach(() => {
        cleanup();
    });

    test('should initialize with correct state', () => {
        const { result } = renderHook(() => useOrderHistoryTable(1, 0, 10, '', '', ''));

        expect(result.current.data).toEqual([]);
        expect(result.current.isLoading).toBe(true);
        expect(result.current.count).toBeUndefined();
    });

    test('should fetch and set data successfully', async () => {
        const mockResponse: OrderHistoryListResponse = {
            result: [
                {
                    order: {
                        transactionDate: '2024-08-25T00:00:00Z',
                        corporateTxnId: 'txn123',
                        paymentMode: 'Credit Card',
                        amountInINR: '100',
                        status: 'Completed',
                        orderResponse: JSON.stringify({
                            subscriptionDetails: {
                                software: { name: 'Software A' },
                                name: 'Plan A',
                            },
                        }),
                        id: 0,
                        ecomOrderStatus: '',
                    },
                },
            ],
            totalData: 1,
        };
        (getOrderHistoryTable as Mock).mockResolvedValue(mockResponse);

        const { result } = renderHook(() => useOrderHistoryTable(1, 0, 10, '', '', ''));

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 500)); // Wait for debounce
        });

        expect(result.current.data).toEqual([
            {
                dateandtime: '2024-08-25T00:00:00Z',
                subscriptionName: 'Software A',
                transactionId: 'txn123',
                plan: 'Plan A',
                paymentMode: 'Credit Card',
                amount: '100',
                status: 'Completed',
            },
        ]);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.count).toBe(1);
    });

    test('should handle API call failure', async () => {
        (getOrderHistoryTable as Mock).mockResolvedValue(false);

        const { result } = renderHook(() => useOrderHistoryTable(1, 0, 10, '', '', ''));

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 500));
        });

        expect(result.current.data).toEqual([]);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.count).toBeUndefined();
    });

    test('should debounce search term correctly', async () => {
        const { rerender } = renderHook(
            ({ search }) => useOrderHistoryTable(1, 0, 10, search, '', ''),
            { initialProps: { search: 'initial' } }
        );

        (getOrderHistoryTable as Mock).mockResolvedValue(false);

        await act(async () => {
            rerender({ search: 'updated' });
            await new Promise(resolve => setTimeout(resolve, 500)); // Wait for debounce
        });

        expect(getOrderHistoryTable).toHaveBeenCalledTimes(2);
    });

    test('should not call API if search term remains the same', async () => {
        const { rerender } = renderHook(
            ({ search }) => useOrderHistoryTable(1, 0, 10, search, '', ''),
            { initialProps: { search: 'same' } }
        );

        (getOrderHistoryTable as Mock).mockResolvedValue(false);

        await act(async () => {
            rerender({ search: 'same' });
            await new Promise(resolve => setTimeout(resolve, 500)); // Wait for debounce
        });

        expect(getOrderHistoryTable).toHaveBeenCalledTimes(1);
    });
});
