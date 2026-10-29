import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import { useAppSelector, useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getHikeOrderHistoryTable } from '../../api/orders';
import { useGetHikeHistoryApi } from '../../hooks/useGetHikeHistoryApi'; // Adjust import path as necessary

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: vi.fn(),
    useAppSelector: vi.fn(),
}));

vi.mock('../../api/orders', () => ({
    getHikeOrderHistoryTable: vi.fn(),
}));

vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn(),
}));

describe('useGetHikeHistoryApi', () => {
    const mockUseAppSelector = useAppSelector as any;
    const mockDispatch = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseAppSelector.mockReturnValue({ role: 'user', id: '123' });
        (useAppDispatch as any).mockReturnValue(mockDispatch);
    });

    it('should initialize with default values', () => {
        const payload = {
            page: 1,
            itemsPerPage: 5,
            search: '',
        };
        const { result } = renderHook(() => useGetHikeHistoryApi(payload));

        expect(result.current.hikeHistoryData).toEqual([]);
        expect(result.current.total).toBe(0);
    });

    it('should fetch hike history data and set loading state', async () => {
        const payload = {
            page: 1,
            itemsPerPage: 5,
            search: '',
        };
        const mockResponse = {
            result: [
                {
                    order: {
                        orderResponse: JSON.stringify({
                            selectedHikes: [
                                {
                                    hikeName: 'Mountain Hike',
                                    quantity: 2,
                                    price: 100,
                                    totalPrice: 200,
                                    employees: [{ name: 'John Doe', employeeId: '1234' }],
                                },
                            ],
                        }),
                        transactionDate: '2023-10-01',
                        amountInINR: '200 AED',
                        status: 'Completed',
                        id: 'order123', // Include this only if the hook outputs it
                    },
                },
            ],
            totalData: 1,
        };

        (getHikeOrderHistoryTable as any).mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => useGetHikeHistoryApi(payload));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.hikeHistoryData).toEqual([
            {
                date: '2023-10-01',
                hikes: [
                    {
                        name: 'Mountain Hike',
                        quantity: 2,
                        price: 100,
                        totalPrice: 200,
                        employees: [{ name: 'John Doe', employeeId: '1234' }],
                    },
                ],
                id: 'order123', // Ensure matches mock data
                status: 'Completed',
            },
        ]);

        expect(result.current.total).toBe(1);
    });

    it('should handle API failure and display error toast', async () => {
        const payload = {
            page: 1,
            itemsPerPage: 5,
            search: '',
        };
        (getHikeOrderHistoryTable as any).mockResolvedValueOnce(null);

        const { result } = renderHook(() => useGetHikeHistoryApi(payload));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(mockDispatch).toHaveBeenCalledWith(
            showToast({
                description: 'Something went wrong while fetching hike history',
                variant: 'error',
            })
        );
        expect(result.current.hikeHistoryData).toEqual([]);
        expect(result.current.total).toBe(0);
    });

    it('should update page number and fetch data again', async () => {
        const payload = {
            page: 2,
            itemsPerPage: 5,
            search: '',
        };
        const mockResponse = {
            result: [
                {
                    order: {
                        orderResponse: JSON.stringify({
                            selectedHikes: [
                                {
                                    hikeName: 'Mountain Hike',
                                    quantity: 1,
                                    price: 100,
                                    totalPrice: 100,
                                    employees: [{ name: 'John Doe', employeeId: '1234' }],
                                },
                            ],
                        }),
                        transactionDate: '2023-10-01',
                        amountInINR: '100 AED',
                        status: 'Completed',
                    },
                },
            ],
            totalData: 1,
        };

        (getHikeOrderHistoryTable as any).mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => useGetHikeHistoryApi(payload));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(getHikeOrderHistoryTable).toHaveBeenCalledWith({
            userId: '123',
            userType: 'user',
            search: '',
            start: 2,
            length: 5,
        });
    });

    it('should update page size and fetch data again', async () => {
        const payload = {
            page: 1,
            itemsPerPage: 10,
            search: '',
        };
        const mockResponse = {
            result: [
                {
                    order: {
                        orderResponse: JSON.stringify({
                            selectedHikes: [
                                {
                                    hikeName: 'Mountain Hike',
                                    quantity: 1,
                                    price: 100,
                                    totalPrice: 100,
                                    employees: [{ name: 'John Doe', employeeId: '1234' }],
                                },
                            ],
                        }),
                        transactionDate: '2023-10-01',
                        amountInINR: '100 AED',
                        status: 'Completed',
                    },
                },
            ],
            totalData: 1,
        };

        (getHikeOrderHistoryTable as any).mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => useGetHikeHistoryApi(payload));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(getHikeOrderHistoryTable).toHaveBeenCalledWith({
            userId: '123',
            userType: 'user',
            search: '',
            start: 1,
            length: 10,
        });
    });

    it('should update search text and fetch data again', async () => {
        const payload = {
            page: 1,
            itemsPerPage: 5,
            search: 'Desert',
        };
        const mockResponse = {
            result: [
                {
                    order: {
                        orderResponse: JSON.stringify({
                            selectedHikes: [
                                {
                                    hikeName: 'Desert Hike',
                                    quantity: 1,
                                    price: 100,
                                    totalPrice: 100,
                                    employees: [{ name: 'Jane Doe', employeeId: '5678' }],
                                },
                            ],
                        }),
                        transactionDate: '2023-10-05',
                        amountInINR: '100 AED',
                        status: 'Pending',
                    },
                },
            ],
            totalData: 1,
        };

        (getHikeOrderHistoryTable as any).mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => useGetHikeHistoryApi(payload));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(getHikeOrderHistoryTable).toHaveBeenCalledWith({
            userId: '123',
            userType: 'user',
            search: 'Desert',
            start: 1,
            length: 5,
        });

        expect(result.current.hikeHistoryData).toEqual([
            {
                date: '2023-10-05',
                hikes: [
                    {
                        name: 'Desert Hike',
                        quantity: 1,
                        price: 100,
                        totalPrice: 100,
                        employees: [{ name: 'Jane Doe', employeeId: '5678' }],
                    },
                ],
                status: 'Pending',
            },
        ]);
    });
});
