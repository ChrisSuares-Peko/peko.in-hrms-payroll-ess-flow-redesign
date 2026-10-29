import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import { SurchargeResponse } from '@customtypes/general';
import GetSurcharge from '@domains/dashboard/esim/hooks/useSurchargeApi';
import { useAppSelector } from '@src/hooks/store';
import { getSurcharge } from '@src/services/surcharge';

// Mock dependencies
vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));
vi.mock('@src/services/surcharge', () => ({
    getSurcharge: vi.fn(),
}));

describe('GetSurcharge', () => {
    const mockUseAppSelector = useAppSelector as any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseAppSelector.mockReturnValue({
            role: 'user',
            id: '123',
            hotels: {
                roomResponse: [{ price: 100 }, { price: 200 }],
            },
        });
    });

    it('should fetch surcharge details and update state on success', async () => {
        const mockResponse: SurchargeResponse = {
            surcharge: '50',
            corporateCashback: '10',
        };

        (getSurcharge as any).mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => GetSurcharge());

        // Wait for the state to update
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        // expect(getSurcharge).toHaveBeenCalledWith({
        //     userId: '123',
        //     userType: 'user',
        //     amount: 0,
        //     accessKey: accessKeys.hotels,
        // });
        expect(result.current.surchargeData).toEqual(mockResponse);
    });

    it('should handle API failure and set surcharge details to undefined', async () => {
        (getSurcharge as any).mockResolvedValueOnce(false);

        const { result } = renderHook(() => GetSurcharge());

        // Wait for the state to update
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        // expect(getSurcharge).toHaveBeenCalledWith({
        //     userId: '123',
        //     userType: 'user',
        //     amount: 300,
        //     accessKey: accessKeys.hotels,
        // });
        expect(result.current.surchargeData).toBeUndefined();
    });

    it('should set loading state correctly during API call', async () => {
        (getSurcharge as any).mockImplementationOnce(
            () => new Promise(resolve => setTimeout(() => resolve(true), 100))
        );

        const { result } = renderHook(() => GetSurcharge());

        expect(result.current.isLoading).toBe(true);

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
        });

        expect(result.current.isLoading).toBe(false);
    });
});
