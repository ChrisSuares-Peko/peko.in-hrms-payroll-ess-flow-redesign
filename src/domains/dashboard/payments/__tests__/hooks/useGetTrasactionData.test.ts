import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { getTransactionDetails } from '../../api';
import useGetTrasactionData from '../../hooks/useGetTransactionData';

vi.mock('../../api/index', () => ({
    getTransactionDetails: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));
describe('useGetTrasactionData', () => {
    const mockTransactionData = {
        id: '123',
        amount: 1000,
        status: 'SUCCESS',
        timestamp: '2025-02-17T10:00:00Z',
    };

    beforeEach(() => {
        (useAppSelector as unknown as any).mockImplementation((selectorFn: any) =>
            selectorFn({
                reducer: {
                    auth: { id: 1, role: 'user' },
                },
            })
        );
        vi.clearAllMocks();
    });

    it('should fetch transaction data when transactionId is provided', async () => {
        // Mock successful API call
        (getTransactionDetails as Mock).mockResolvedValue(mockTransactionData);

        const { result } = renderHook(() => useGetTrasactionData('123'));

        expect(result.current.isLoading).toBe(true);

        // Wait for the data to be fetched
        await waitFor(() => {});

        expect(result.current.transactionData).toEqual(mockTransactionData);
        expect(result.current.isLoading).toBe(false);
    });

    it('should not fetch data when transactionId is falsy', async () => {
        const { result } = renderHook(() => useGetTrasactionData(null));

        expect(result.current.isLoading).toBe(false);
        expect(result.current.transactionData).toBeUndefined();
    });

    it('should handle API error gracefully', async () => {
        // Mock API call to return false or throw an error
        (getTransactionDetails as Mock).mockResolvedValue(false);

        const { result } = renderHook(() => useGetTrasactionData('123'));

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => {});

        expect(result.current.transactionData).toBeUndefined();
        expect(result.current.isLoading).toBe(false);
    });

    it('should handle re-fetch when transactionId changes', async () => {
        // Mock API call to return different mock data for different IDs
        (getTransactionDetails as Mock)
            .mockResolvedValueOnce(mockTransactionData)
            .mockResolvedValueOnce({ ...mockTransactionData, id: '456' });

        const { result, rerender } = renderHook(
            ({ transactionId }) => useGetTrasactionData(transactionId),
            {
                initialProps: { transactionId: '123' },
            }
        );

        expect(result.current.isLoading).toBe(true);
        await waitFor(() => {});
        expect(result?.current?.transactionData?.id).toBe('123');
        expect(result.current.isLoading).toBe(false);

        rerender({ transactionId: '456' });

        expect(result.current.isLoading).toBe(true);
        await waitFor(() => {});

        expect(result.current.transactionData?.id).toBe('456');
        expect(result.current.isLoading).toBe(false);
    });
});
