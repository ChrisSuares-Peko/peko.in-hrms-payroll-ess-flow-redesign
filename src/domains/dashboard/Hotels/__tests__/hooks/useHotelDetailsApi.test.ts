import { renderHook, act } from '@testing-library/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { hotelAndRoomDetails } from '@domains/dashboard/Hotels/Api';
import useHotelDetailsApi from '@domains/dashboard/Hotels/hooks/useHotelDetailsApi';
import { getDetails } from '@domains/dashboard/Hotels/slices/getHotelSlice';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';

// Mock dependencies
vi.mock('react-router-dom', () => ({
    useNavigate: vi.fn(),
    useLocation: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: vi.fn(),
    useAppSelector: vi.fn(),
}));

vi.mock('@domains/dashboard/Hotels/Api', () => ({
    hotelAndRoomDetails: vi.fn(),
}));

vi.mock('@domains/dashboard/Hotels/slices/getHotelSlice', () => ({
    getDetails: vi.fn(),
}));

vi.mock('@src/routes/paths', () => ({
    paths: {
        dashboard: {
            corporateTravel: '/dashboard/corporate-travel',
            hotels: {
                index: '/hotels',
                details: '/details',
            },
        },
    },
}));

describe('useHotelDetailsApi', () => {
    const mockNavigate = vi.fn();
    const mockDispatch = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useNavigate as any).mockReturnValue(mockNavigate);
        (useLocation as any).mockReturnValue({
            state: { key: 'some-key' },
        });
        (useAppDispatch as any).mockReturnValue(mockDispatch);
        (useAppSelector as any).mockReturnValue({
            role: 'user',
            id: '123',
        });
    });

    it('should call hotelAndRoomDetails API and dispatch getDetails on success', async () => {
        const mockApiResponse = {
            response: { hotelName: 'Test Hotel', rooms: [] },
        };
        (hotelAndRoomDetails as any).mockResolvedValueOnce(mockApiResponse);

        const { result } = renderHook(() => useHotelDetailsApi('conversation123'));

        // Simulate useEffect trigger
        await act(async () => {
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            result.current;
        });

        expect(hotelAndRoomDetails).toHaveBeenCalledWith({
            userId: '123',
            userType: 'user',
            Hotelcodes: 'conversation123',
        });

        expect(mockDispatch).toHaveBeenCalledWith(getDetails(mockApiResponse.response as any));
        expect(result.current.isLoading).toBe(false);
    });

    it('should not call hotelDetails if key is missing', () => {
        (useLocation as any).mockReturnValue({ state: {} });

        const { result } = renderHook(() => useHotelDetailsApi('conversation123'));

        expect(hotelAndRoomDetails).not.toHaveBeenCalled();
        expect(result.current.isLoading).toBe(false);
    });
});
