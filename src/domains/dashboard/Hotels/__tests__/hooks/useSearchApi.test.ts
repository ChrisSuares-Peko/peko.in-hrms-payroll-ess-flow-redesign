import { renderHook, act, waitFor } from '@testing-library/react';
import { useDispatch } from 'react-redux';
import { vi, describe, it, beforeEach, expect, afterEach } from 'vitest';

import { getHotels } from '@domains/dashboard/Hotels/Api';
import useSearchApi from '@domains/dashboard/Hotels/hooks/useSearchApi';
import { useAppSelector } from '@src/hooks/store';

// Mock dependencies
vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));
vi.mock('@domains/dashboard/Hotels/Api', () => ({
    getHotels: vi.fn(),
}));
vi.mock('react-redux', () => ({
    useDispatch: vi.fn(() => vi.fn()),
}));
vi.mock('react-router-dom', () => ({
    useLocation: vi.fn(() => ({ state: { key: 'search123' } })),
}));

describe('useSearchApi', () => {
    const mockUseAppSelector = useAppSelector as any;
    const mockDispatch = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseAppSelector.mockImplementation((selector: any) =>
            selector({
                reducer: {
                    auth: { role: 'user', id: '123' },
                    hotels: {
                        hotelsRequest: {
                            country: 'USA',
                            city: 'New York',
                            checkIn: '2024-08-01',
                            checkOut: '2024-08-05',
                            rooms: [{ adult: 2, child: 0, childAge: [], roomIndex: 1 }],
                        },
                    },
                },
            })
        );
        vi.mocked(useDispatch).mockReturnValue(mockDispatch);
    });

    afterEach(() => {
        vi.useRealTimers(); // Restore real timers after each test
    });

    it('should fetch hotel data and update state on success', async () => {
        const mockResponse = {
            searchResults: [
                { HotelCode: 'hotel1', Rooms: [{ TotalFare: 200 }] },
                { HotelCode: 'hotel2', Rooms: [{ TotalFare: 300 }] },
            ],
            hotelCodeList: [{ HotelCode: 'hotel1' }, { HotelCode: 'hotel2' }],
            hotelDetails: [
                { HotelCode: 'hotel1', Details: 'Details for Hotel 1' },
                { HotelCode: 'hotel2', Details: 'Details for Hotel 2' },
            ],
        };

        (getHotels as any).mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => useSearchApi());

        await act(async () => {
            await result.current.hotelsList();
        });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(getHotels).toHaveBeenCalledWith({
            userId: '123',
            userType: 'user',
            country: 'USA',
            city: 'New York',
            checkIn: '2024-08-01',
            checkOut: '2024-08-05',
            rooms: [{ adult: 2, child: 0, childAge: [], roomIndex: 1 }],
        });

        expect(result.current.data).toEqual([
            { HotelCode: 'hotel1', Rooms: [{ TotalFare: 200 }], Details: 'Details for Hotel 1' },
            { HotelCode: 'hotel2', Rooms: [{ TotalFare: 300 }], Details: 'Details for Hotel 2' },
        ]);
    });

    it('should handle API failure and set state to empty values', async () => {
        (getHotels as any).mockResolvedValueOnce(false);

        const { result } = renderHook(() => useSearchApi());

        await act(async () => {
            await result.current.hotelsList();
        });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(getHotels).toHaveBeenCalledWith({
            userId: '123',
            userType: 'user',
            country: 'USA',
            city: 'New York',
            checkIn: '2024-08-01',
            checkOut: '2024-08-05',
            rooms: [{ adult: 2, child: 0, childAge: [], roomIndex: 1 }],
        });

        expect(result.current.data).toEqual([]);
        expect(result.current.searchKey).toBe('');
        expect(result.current.conversationId).toBe('');
    });
});
