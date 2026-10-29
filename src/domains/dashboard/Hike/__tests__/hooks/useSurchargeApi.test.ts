import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import { SurchargeResponse } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';
import { getSurcharge } from '@src/services/surcharge';

import GetSurcharge from '../../hooks/useSurchargeApi'; // Adjust the import path if necessary

// Mock the dependencies
vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));
vi.mock('@src/services/surcharge', () => ({
    getSurcharge: vi.fn(),
}));

describe('GetSurcharge Hook', () => {
    const mockUseAppSelector = useAppSelector as any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseAppSelector.mockReturnValue({
            role: 'user',
            id: '123',
            hike: {
                amount: 500, // Ensure amount is a number
            },
        });
    });

    it('should fetch surcharge details and update state on success', async () => {
        const mockResponse: SurchargeResponse = {
            surcharge: '50',
            corporateCashback: '10',
        };

        // Mock the API response
        (getSurcharge as any).mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => GetSurcharge());

        // Check that isLoading is true initially
        expect(result.current.isLoading).toBe(true);

        // Wait for the hook to complete
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        // Verify API call parameters (use actual value for accessKey)
        // expect(getSurcharge).toHaveBeenCalledWith({
        //     userId: '123',
        //     userType: 'user',
        //     amount: 500,
        //     accessKey: accessKeys.hike, // Ensure accessKey matches actual import
        // });

        // Check the surcharge data
        expect(result.current.surchargeData).toEqual(mockResponse);
    });

    it('should handle API failure and set surcharge data to undefined', async () => {
        // Mock the API to return false (failure)
        (getSurcharge as any).mockResolvedValueOnce(false);

        const { result } = renderHook(() => GetSurcharge());

        // Wait for the hook to complete
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        // Check that surchargeData is undefined after failure
        expect(result.current.surchargeData).toBeUndefined();
    });

    it('should set loading state correctly during API call', async () => {
        (getSurcharge as any).mockImplementationOnce(
            () => new Promise(resolve => setTimeout(() => resolve(true), 100))
        );

        const { result } = renderHook(() => GetSurcharge());

        // Check that isLoading is true during the API call
        expect(result.current.isLoading).toBe(true);

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
        });

        // Check that isLoading is set to false after the call
        expect(result.current.isLoading).toBe(false);
    });
});
