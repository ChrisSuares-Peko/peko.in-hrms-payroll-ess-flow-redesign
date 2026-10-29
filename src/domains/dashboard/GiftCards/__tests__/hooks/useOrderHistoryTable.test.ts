import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { getOrderHistoryTable } from '../../api/index';
import { useOrderHistoryTable } from '../../hooks/useOrderHistoryTable';

// Mock dependencies
vi.mock('../../api/index', () => ({
    getOrderHistoryTable: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

describe('useOrderHistoryTable Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as Mock).mockReturnValue({ role: 'admin', id: '123' });
    });

    it('should start with loading state as true', async () => {
        (getOrderHistoryTable as Mock).mockResolvedValue(null);

        const { result } = renderHook(() => useOrderHistoryTable(1, 0, 10, ''));

        expect(result.current.isLoading).toBe(true);
    });

    it('should fetch and set order history data successfully', async () => {
        const mockOrderHistoryResponse = {
            totalData: 5,
            result: [
                {
                    order: {
                        corporateTxnId: 'txn-123',
                        transactionDate: '2024-02-08',
                        paymentMode: 'Credit Card',
                        status: 'Completed',
                        amountInINR: '500.00',
                        orderType: 'GiftCard',
                        quantity: 1,
                        orderResponse: JSON.stringify({
                            giftCardDetails: {
                                product_name: 'Amazon Gift Card',
                            },
                        }),
                    },
                },
            ],
        };

        (getOrderHistoryTable as Mock).mockResolvedValue(mockOrderHistoryResponse);

        const { result } = renderHook(() => useOrderHistoryTable(1, 0, 10, ''));

        await act(async () => {});

        expect(result.current.data).toHaveLength(1);
        expect(result.current.data[0]).toEqual({
            txnId: 'txn-123',
            date: '2024-02-08',
            giftCardName: 'Amazon Gift Card',
            paymentMode: 'Credit Card',
            status: 'Completed',
            amount: '500.00',
            orderType: 'N/A',
            quantity: 0,
            formData: {
                amount: '',
                quantity: '',
                orderType: '',
            },
            addressDetails: {
                receiverFirstName: '',
                receiverEmail: '',
                senderName: '',
                message: '',
                employee: [],
            },
            productDetails: {
                id: undefined,
                product_id: undefined,
                product_name: 'Amazon Gift Card',
                product_image: undefined,
                accessKey: undefined,
                serviceOperatorId: undefined,
            },
        });
        expect(result.current.count).toBe(5);
        expect(result.current.isLoading).toBe(false);
    });

    it('should return empty data if API response is empty', async () => {
        (getOrderHistoryTable as Mock).mockResolvedValue({ totalData: 0, result: [] });

        const { result } = renderHook(() => useOrderHistoryTable(1, 0, 10, ''));

        await act(async () => {});

        expect(result.current.data).toEqual([]);
        expect(result.current.count).toBe(0);
        expect(result.current.isLoading).toBe(false);
    });

    it('should debounce API calls when search text changes', async () => {
        (getOrderHistoryTable as Mock).mockResolvedValue({ totalData: 0, result: [] });

        const { result, rerender } = renderHook(
            ({ search }) => useOrderHistoryTable(1, 0, 10, search),
            { initialProps: { search: '' } }
        );

        expect(result.current.isLoading).toBe(true);

        await act(async () => {
            rerender({ search: 'Amazon' });
        });

        expect(getOrderHistoryTable).toHaveBeenCalledTimes(1);
    });

    it('should call API with correct parameters', async () => {
        (getOrderHistoryTable as Mock).mockResolvedValue({ totalData: 0, result: [] });

        const { result } = renderHook(({ search }) => useOrderHistoryTable(1, 0, 10, search), {
            initialProps: { search: 'Amazon' },
        });

        // Wait for API call
        await act(async () => {});

        // Ensure API is called with correct parameters
        expect(getOrderHistoryTable).toHaveBeenCalledWith({
            userId: '123',
            userType: 'admin',
            draw: 1,
            start: 0,
            length: 10,
            search: 'Amazon',
            from: '',
            to: '',
        });

        expect(result.current.isLoading).toBe(false);
    });
});
