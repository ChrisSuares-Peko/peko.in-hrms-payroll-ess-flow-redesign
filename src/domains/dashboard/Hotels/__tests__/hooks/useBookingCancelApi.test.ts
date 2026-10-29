import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import { cancelbookings } from '@domains/dashboard/Hotels/Api';
import useBookingCancelApi from '@domains/dashboard/Hotels/hooks/useBookingCancelApi';
import { useAppSelector } from '@src/hooks/store';

// Mock dependencies
vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(() => vi.fn()), // Mock dispatch
}));

vi.mock('@domains/dashboard/Hotels/Api', () => ({
    cancelbookings: vi.fn(),
}));

describe('useBookingCancelApi', () => {
    const mockUseAppSelector = useAppSelector as any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseAppSelector.mockReturnValue({
            role: 'user',
            id: '123',
            corporateTxnId: 'corpTxnId',
        });
    });

    it('should cancel booking successfully and set loader to false', async () => {
        const mockResponse = { status: true, data: { status: 'Processed' } }; // Ensuring correct mock response format
        (cancelbookings as any).mockResolvedValueOnce(mockResponse); // Mock the response

        const { result } = renderHook(() => useBookingCancelApi());

        // Act: Trigger the cancelBooked function
        await act(async () => {
            const success = await result.current.cancelBooked(123, 'otp123', 'scope123');

            // Assert: Ensure the function returns true
            expect(success).toBe(true);
        });

        // Assert: Ensure that loading state is set to false after the API call
        expect(result.current.loader).toBe(false);

        // Assert: Ensure the cancelbookings API is called with the correct parameters
        expect(cancelbookings).toHaveBeenCalledWith({
            userId: '123',
            userType: 'user',
            orderId: 123,
            otp: 'otp123',
            scope: 'scope123',
            selectedCorporateTxnId: 'corpTxnId',
        });
    });
});
