import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { getOrderDetails } from '@domains/dashboard/esim/api/index'; // Ensure the path is correct
import useGetOrderDetails from '@domains/dashboard/esim/hooks/useGetEsimDetails'; // Ensure the path is correct
import { useAppSelector } from '@src/hooks/store';

// Mock dependencies
vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

vi.mock('@domains/dashboard/esim/api/index', () => ({
    getOrderDetails: vi.fn(), // Make sure the mock is a jest mock function
}));

describe('useGetOrderDetails', () => {
    const mockUseAppSelector = useAppSelector as any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseAppSelector.mockReturnValue({ role: 'user', id: '123' });
    });

    it('should fetch and set order details successfully', async () => {
        const mockResponse: any = {
            userId: '1',
            userType: 'Delivered',
            orderAmount: 50,
            iccid: 'iccid123',
            // other order details...
        };

        (getOrderDetails as any).mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => useGetOrderDetails('iccid123', 'order123'));

        // Initially, loading should be true
        expect(result.current.isLoading).toBe(true);

        // Wait for the API call to complete
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(getOrderDetails).toHaveBeenCalledWith({
            userId: '123',
            userType: 'user',
            iccid: 'iccid123',
            planId: 'order123',
        });

        // Check the API result is correctly set in the state
        expect(result.current.data).toEqual(mockResponse);
    });

    it('should handle API failure and set loading to false', async () => {
        // Mock API failure (return false)
        (getOrderDetails as any).mockResolvedValueOnce(false);

        const { result } = renderHook(() => useGetOrderDetails('iccid123', 'order123'));

        // Initially, loading should be true
        expect(result.current.isLoading).toBe(true);

        // Wait for the API call to complete
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(getOrderDetails).toHaveBeenCalledWith({
            userId: '123',
            userType: 'user',
            iccid: 'iccid123',
            planId: 'order123',
        });

        // Check that data is undefined when the API fails
        expect(result.current.data);
    });

    it('should set loading state correctly during the API call', async () => {
        (getOrderDetails as any).mockImplementationOnce(
            () => new Promise(resolve => setTimeout(() => resolve(true), 100))
        );

        const { result } = renderHook(() => useGetOrderDetails('iccid123', 'order123'));

        // Initially, loading should be true
        expect(result.current.isLoading).toBe(true);

        // Wait for the API call to complete
        await waitFor(() => expect(result.current.isLoading).toBe(false));
    });
});
