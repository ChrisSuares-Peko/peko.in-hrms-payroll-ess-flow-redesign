import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import { allBookings } from '@domains/dashboard/Hotels/Api';
import useManageBookingsApi from '@domains/dashboard/Hotels/hooks/useManageBookingApi';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';

// Mock dependencies
vi.mock('@src/hooks/store', () => ({
    useAppDispatch: vi.fn(),
    useAppSelector: vi.fn(),
}));
vi.mock('@domains/dashboard/Hotels/Api', () => ({
    allBookings: vi.fn(),
}));

describe('useManageBookingsApi', () => {
    const mockUseAppDispatch = useAppDispatch as any;
    const mockUseAppSelector = useAppSelector as any;
    const mockDispatch = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseAppSelector.mockReturnValue({ role: 'user', id: '123' });
        mockUseAppDispatch.mockReturnValue(mockDispatch);
    });

    it('should fetch and set booking data successfully', async () => {
        const mockResponse: any = {
            bookings: [
                {
                    bookingId: '1',
                    bookingName: 'Test Booking 1',
                    // add other properties as needed
                },
                {
                    bookingId: '2',
                    bookingName: 'Test Booking 2',
                    // add other properties as needed
                },
            ],
            // add other properties as needed
        };

        (allBookings as any).mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => useManageBookingsApi(1));

        await act(async () => {
            await result.current.refetch();
        });

        expect(allBookings).toHaveBeenCalledWith({
            userId: '123',
            userType: 'user',
            currentPage: 1,
        });
        expect(result.current.isLoading).toBe(false);
        expect(result.current.data).toEqual(mockResponse.bookings);
        expect(result.current.bookings).toEqual(mockResponse);
    });

    it('should handle API failure and set loading to false', async () => {
        (allBookings as any).mockResolvedValueOnce(false);

        const { result } = renderHook(() => useManageBookingsApi(1));

        await act(async () => {
            await result.current.refetch();
        });

        expect(allBookings).toHaveBeenCalledWith({
            userId: '123',
            userType: 'user',
            currentPage: 1,
        });
        expect(result.current.isLoading).toBe(false);
        expect(result.current.data).toEqual([]);
        expect(result.current.bookings).toBeUndefined();
    });

    it('should set loading state during the API call', async () => {
        (allBookings as any).mockImplementationOnce(
            () => new Promise(resolve => setTimeout(() => resolve(true), 100))
        );

        const { result } = renderHook(() => useManageBookingsApi(1));

        act(() => {
            result.current.refetch();
        });

        expect(result.current.isLoading).toBe(true);

        await act(async () => {
            // Wait for the mock API to resolve
            await new Promise(resolve => setTimeout(resolve, 100));
        });

        expect(result.current.isLoading).toBe(false);
    });
});
