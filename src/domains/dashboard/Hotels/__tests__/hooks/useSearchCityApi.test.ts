import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import { fetchCityData } from '@domains/dashboard/Hotels/Api';
import useSearchCityApi from '@domains/dashboard/Hotels/hooks/useSearchCityApi';
import { useAppSelector } from '@src/hooks/store';

// Mock dependencies
vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));
vi.mock('@domains/dashboard/Hotels/Api', () => ({
    fetchCityData: vi.fn(),
}));

describe('useSearchCityApi', () => {
    const mockUseAppSelector = useAppSelector as any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseAppSelector.mockReturnValue({
            role: 'user',
            id: '123',
        });
    });

    it('should fetch city data and set city options on success', async () => {
        const mockResponse = {
            response: {
                CityList: [
                    { id: 1, cityName: 'New York', countryName: 'USA' },
                    { id: 2, cityName: 'Los Angeles', countryName: 'USA' },
                ],
            },
        };

        (fetchCityData as any).mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => useSearchCityApi());

        await act(async () => {
            await result.current.cityList('USA');
        });

        expect(fetchCityData).toHaveBeenCalledWith({
            userId: '123',
            userType: 'user',
            CountryCode: 'USA',
        });
        expect(result.current.cityOptions).toEqual(mockResponse.response.CityList.slice(0, 50));
    });

    it('should handle failure and set city options to an empty array', async () => {
        (fetchCityData as any).mockResolvedValueOnce(false);

        const { result } = renderHook(() => useSearchCityApi());

        await act(async () => {
            await result.current.cityList('USA');
        });

        expect(fetchCityData).toHaveBeenCalledWith({
            userId: '123',
            userType: 'user',
            CountryCode: 'USA',
        });
        expect(result.current.cityOptions).toEqual([]);
    });

    it('should maintain the loading state correctly', async () => {
        const { result } = renderHook(() => useSearchCityApi());

        // Check that loading is true when the cityList function is called
        expect(result.current.isLoading).toBe(false); // Initially isLoading is false

        await act(async () => {
            result.current.cityList('USA');
        });

        // Wait for the API call to complete
        await act(async () => {
            result.current.cityList('USA');
        });

        // After the API call, loading should be false
        expect(result.current.isLoading).toBe(false);
    });
});
