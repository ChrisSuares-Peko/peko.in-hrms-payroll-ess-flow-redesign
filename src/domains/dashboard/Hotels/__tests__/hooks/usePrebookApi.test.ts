import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import { prebookHotel } from '@domains/dashboard/Hotels/Api';
import usePrebookApi from '@domains/dashboard/Hotels/hooks/usePrebookApi';
import { HotelBookingResponse } from '@domains/dashboard/Hotels/types/bookingTypes';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';

// Mock dependencies
vi.mock('@src/hooks/store', () => ({
    useAppDispatch: vi.fn(),
    useAppSelector: vi.fn(),
}));
vi.mock('@domains/dashboard/Hotels/Api', () => ({
    prebookHotel: vi.fn(),
}));

describe('usePrebookApi', () => {
    const mockUseAppDispatch = useAppDispatch as any;
    const mockUseAppSelector = useAppSelector as any;
    const mockDispatch = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseAppSelector.mockReturnValue({ role: 'user', id: '123' });
        mockUseAppDispatch.mockReturnValue(mockDispatch);
    });

    it('should prebook a hotel successfully and return the response', async () => {
        const mockResponse: HotelBookingResponse = {
            conversationId: 'conversation123',
            cancellationPolicy: '',
            meta: {
                success: true,
                statusCode: 200,
                statusMessage: 'OK',
                actionType: 'prebook',
                conversationId: 'conversation123',
            },
            data: [
                {
                    hotel: {
                        hotelKey: 'hotelKey123',
                        bookingKey: 'bookingKey123',
                        name: 'Hotel Deluxe',
                        totalNet: 500,
                        currency: 'USD',
                        checkInDate: '2024-12-01',
                        checkOutDate: '2024-12-10',
                        priceChangeIndicator: false,
                        rooms: [
                            {
                                roomIndex: 1,
                                roomKey: 'roomKey123',
                                roomId: 'roomId123',
                                roomTypeDesc: 'Deluxe Room',
                                maxOccupancy: 2,
                                ratePlan: {
                                    supplierCode: 'supplier123',
                                    meal: 'Breakfast included',
                                    availableStatus: 'Available',
                                    cancelPolicyIndicator: 'Free Cancellation',
                                    code: 'RP123',
                                    isPackage: false,
                                    fixedCombo: false,
                                    gstAssured: true,
                                },
                                roomRate: {
                                    currency: 'USD',
                                    netAmount: 500,
                                    rates: [
                                        {
                                            name: 'Base Rate',
                                            amount: 500,
                                            from: '2024-12-01',
                                            rateIndex: '1',
                                            to: '2024-12-10',
                                        },
                                    ],
                                },
                                rateNotes: 'Special discount applied',
                                financialInfo: {
                                    supplier: 'Supplier ABC',
                                },
                            },
                        ],
                    },
                    mandatoryBookData: {
                        taxDetail: true,
                        PassportDetails: {
                            isPassportMandatory: true,
                            isCrpPassportMandatory: true,
                        },
                    },
                },
            ],
            version: '1.0',
        };

        (prebookHotel as any).mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => usePrebookApi());

        const data = await act(async () => result.current.PrebookDetails('hotelKey123', 5));

        expect(prebookHotel).toHaveBeenCalledWith({
            userId: '123',
            userType: 'user',
            BookingCode: 'hotelKey123',
            amount:5
        });
        expect(data).toEqual(mockResponse);
    });

    it('should handle prebooking failure and return false', async () => {
        (prebookHotel as any).mockResolvedValueOnce(false);

        const { result } = renderHook(() => usePrebookApi());

        const data = await act(async () => result.current.PrebookDetails('hotelKey123', 5));

        expect(prebookHotel).toHaveBeenCalledWith({
            userId: '123',
            userType: 'user',
            BookingCode: 'hotelKey123',
            amount:5
        });
        expect(data).toBe(false);
    });

    it('should maintain the loading state correctly', async () => {
        const { result } = renderHook(() => usePrebookApi());

        expect(result.current.isLoading).toBe(true);

        await act(async () => {
            result.current.PrebookDetails('hotelKey123', 7);
        });

        expect(result.current.isLoading).toBe(true);
    });
});
