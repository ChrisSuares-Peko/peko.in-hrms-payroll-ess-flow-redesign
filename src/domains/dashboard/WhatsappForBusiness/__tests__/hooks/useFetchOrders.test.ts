import { renderHook, act } from '@testing-library/react';
import { describe, beforeEach, it, expect, vi, Mock } from 'vitest';

import { fetchOrders } from '../../api/orderHistory';
import { useFetchOrders } from '../../hooks/useFetchOrders';
import { Order, Pagination } from '../../types/orderHistory';

vi.mock('../../api/orderHistory', () => ({
    fetchOrders: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({ role: 'user', id: '123' })),
}));

describe('useFetchOrders Hook', () => {
    const mockOrders: Order[] = [
        {
            id: 1,
            corporateTxnId: '',
            operatorId: '',
            providerId: '',
            transactionDate: '',
            accountNo: null,
            amountInINR: '',
            baseAmount: '',
            paymentMode: '',
            orderResponse: null,
            paymentModeResponse: null,
            surcharge: '',
            baseCurrency: '',
            exchangeRate: '',
            status: '',
            message: '',
            ecomOrderStatus: '',
            workspaceOrderStatus: '',
            shipmentStatus: [],
            createdAt: '',
            updatedAt: '',
            serviceOperatorId: 0,
            credentialId: 0,
        },
        {
            id: 2,
            corporateTxnId: '',
            operatorId: '',
            providerId: '',
            transactionDate: '',
            accountNo: null,
            amountInINR: '',
            baseAmount: '',
            paymentMode: '',
            orderResponse: null,
            paymentModeResponse: null,
            surcharge: '',
            baseCurrency: '',
            exchangeRate: '',
            status: '',
            message: '',
            ecomOrderStatus: '',
            workspaceOrderStatus: '',
            shipmentStatus: [],
            createdAt: '',
            updatedAt: '',
            serviceOperatorId: 0,
            credentialId: 0,
        },
    ];

    const mockPagination: Pagination = {
        currentPage: 1,
        pageSize: 10,
        totalPages: 2,
        totalOrders: 20,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize with default values', () => {
        const { result } = renderHook(() => useFetchOrders());

        expect(result.current.isLoading).toBe(false);
        expect(result.current.orders).toEqual([]);
        expect(result.current.pagination).toEqual({
            currentPage: 1,
            pageSize: 10,
            totalPages: 0,
            totalOrders: 0,
        });
    });

    it('should fetch and update orders & pagination when loadOrders is called', async () => {
        (fetchOrders as Mock).mockResolvedValue({
            orders: mockOrders,
            pagination: mockPagination,
        });

        const { result } = renderHook(() => useFetchOrders());

        await act(async () => {
            await result.current.loadOrders('test', 1, 10);
        });

        expect(fetchOrders).toHaveBeenCalledWith({
            userId: '123',
            userType: 'user',
            searchText: 'test',
            page: 1,
            pageSize: 10,
        });

        expect(result.current.orders).toEqual(mockOrders);
        expect(result.current.pagination).toEqual(mockPagination);
        expect(result.current.isLoading).toBe(false);
    });

    it('should handle API errors gracefully', async () => {
        (fetchOrders as Mock).mockRejectedValue(new Error('API Error'));

        const { result } = renderHook(() => useFetchOrders());

        await act(async () => {
            await result.current.loadOrders('test', 1, 10);
        });

        expect(fetchOrders).toHaveBeenCalledTimes(1);
        expect(result.current.orders).toEqual([]);
        expect(result.current.isLoading).toBe(false);
    });

    it('should set isLoading state correctly during and after fetching', async () => {
        (fetchOrders as Mock).mockResolvedValue({
            orders: mockOrders,
            pagination: mockPagination,
        });

        const { result } = renderHook(() => useFetchOrders());

        act(() => {
            result.current.loadOrders('test', 1, 10);
        });

        expect(result.current.isLoading).toBe(true);

        await act(async () => {
            await result.current.loadOrders('test', 1, 10);
        });

        expect(result.current.isLoading).toBe(false);
    });
});
