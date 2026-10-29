import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { getOrdersList } from '@domains/dashboard/esim/api/index'; // Ensure the path is correct
import useGetOrdersList from '@domains/dashboard/esim/hooks/useGetOrdersList'; // Ensure the path is correct
import { useAppSelector } from '@src/hooks/store';

// Mock dependencies
vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

vi.mock('@domains/dashboard/esim/api/index', () => ({
    getOrdersList: vi.fn(), // Ensure the mock function is correctly defined as a vi.fn()
}));

describe('useGetOrdersList', () => {
    const mockUseAppSelector = useAppSelector as any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseAppSelector.mockReturnValue({ role: 'user', id: '123' });
    });

    const mockResponse = {
        data: [
            {
                createdAt: '2024-09-12',
                orderId: 'order123',
                amountInINR: 100,
                transactionId: 'txn123',
                simDetailsEsim: 'iccid123',
                simDetailsPlanId: 'plan123',
                paymentMode: 'CARD',
                status: 'SUCCESS',
                customerUid: 'customer123',
                country: 'Germany',
                planName: 'Germany, Unlimited, 7 Days',
                dataSize: '1 GB',
                validity: '7 days',
                activationMode: 'FIRST_USE',
                activatedAt: null,
                expiresAt: '2024-09-19',
                installationUrl: 'https://install.example',
            },
        ],
        recordsTotal: 10,
    };

    it('should return orders data and loading state correctly', async () => {
        // Arrange
        (getOrdersList as any).mockResolvedValue(mockResponse);

        // Act
        const { result } = renderHook(() => useGetOrdersList(10, 1, '', '', ''));

        // Wait for the hook to finish loading
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        // Assert
        expect(result.current.isLoading).toBe(false);
        expect(result.current.data).toEqual([
            {
                date: '2024-09-12',
                id: 'order123',
                plan: 'Germany, Unlimited, 7 Days',
                amount: 100,
                orderId: 'txn123',
                quantity: 1,
                iccid: 'iccid123',
                planId: 'plan123',
                paymentMethod: 'card',
                status: 'SUCCESS',
                customerUid: 'customer123',
                country: 'Germany',
                dataSize: '1 GB',
                validity: '7 days',
                activationMode: 'FIRST_USE',
                activatedAt: null,
                expiresAt: '2024-09-19',
                installationUrl: 'https://install.example',
            },
        ]);
        expect(result.current.totalRecord).toBe(10);
    });

    it('should call getOrdersList with correct parameters', async () => {
        // Arrange
        const itemsPerPage = 10;
        const page = 1;
        const searchText = 'searchText';
        const fromDate = '2024-09-01';
        const toDate = '2024-09-30';
        (getOrdersList as any).mockResolvedValue(mockResponse);

        // Act
        renderHook(() => useGetOrdersList(itemsPerPage, page, searchText, fromDate, toDate));

        // Assert
        expect(getOrdersList).toHaveBeenCalledWith({
            userId: '123',
            userType: 'user',
            itemsPerPage,
            page,
            searchText,
            fromDate,
            toDate,
        });
    });

    it('should set loading state to true while fetching data', async () => {
        // Arrange
        (getOrdersList as any).mockResolvedValue(mockResponse);

        // Act
        const { result } = renderHook(() => useGetOrdersList(10, 1, '', '', ''));

        // Assert loading is initially true
        expect(result.current.isLoading).toBe(true);

        // Wait for the hook to finish loading
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        // Assert
        expect(result.current.isLoading).toBe(false);
    });

    it('should handle empty response from getOrdersList', async () => {
        // Arrange
        (getOrdersList as any).mockResolvedValue({ data: [], recordsTotal: 0 });

        // Act
        const { result } = renderHook(() => useGetOrdersList(10, 1, '', '', ''));

        // Wait for the hook to finish loading
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        // Assert
        expect(result.current.data).toEqual([]);
        expect(result.current.totalRecord).toBe(0);
    });

    it('should handle API failure and set loading to false', async () => {
        // Mock API failure (return false)
        (getOrdersList as any).mockResolvedValueOnce(false);

        const { result } = renderHook(() =>
            useGetOrdersList(10, 1, '', '24-10-2024', '30-10-2024')
        );

        // Initially, loading should be true
        expect(result.current.isLoading).toBe(true);

        // Wait for the API call to complete
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(getOrdersList).toHaveBeenCalledWith({
            userId: '123',
            userType: 'user',
            itemsPerPage: 10,
            fromDate: '24-10-2024',
            toDate: '30-10-2024',
            page: 1,
            searchText: '',
        });

        // Check that data is undefined when the API fails
        expect(result.current.data).toBeUndefined();
        expect(result.current.totalRecord).toBe(1); // As it is set to 1 initially
    });
});
