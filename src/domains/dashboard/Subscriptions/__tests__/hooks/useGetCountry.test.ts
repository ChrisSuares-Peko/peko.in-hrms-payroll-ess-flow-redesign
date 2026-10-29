import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, Mock, test, vi } from 'vitest';

import { DropDown } from '@customtypes/general';

import { getCountries } from '../../api/index';
import useGeneralApi from '../../hooks/useGetCountry';

// Mock the API call
vi.mock('../../api/index', () => ({
    getCountries: vi.fn(),
}));

describe('useGeneralApi Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    afterEach(() => {
        cleanup();
    });
    test('should initialize with empty countriesList', () => {
        const { result } = renderHook(() => useGeneralApi());

        // Check initial state
        expect(result.current.countriesList).toBeUndefined();
    });

    test('should update countriesList when getCountries returns data', async () => {
        const mockCountriesData: DropDown = [
            { label: 'USA', value: 'US' },
            { label: 'Canada', value: 'CA' },
        ];

        (getCountries as Mock).mockResolvedValue({
            countries: mockCountriesData,
        });

        const { result } = renderHook(() => useGeneralApi());

        // Wait for useEffect to run and state to update
        await act(async () => {
            // Since there's no direct way to wait for useEffect in this setup, we'll await a small timeout
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.countriesList).toEqual(mockCountriesData);
    });

    test('should not update countriesList when getCountries returns false', async () => {
        // Mock the API response to return false
        (getCountries as Mock).mockResolvedValue(false);

        const { result } = renderHook(() => useGeneralApi());

        // Wait for useEffect to run and state to update
        await act(async () => {
            // Since there's no direct way to wait for useEffect in this setup, we'll await a small timeout
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.countriesList).toBeUndefined();
    });

    test('should call getCountries on mount', async () => {
        (getCountries as Mock).mockResolvedValue({
            countries: [],
        });

        renderHook(() => useGeneralApi());

        expect(getCountries).toHaveBeenCalledTimes(1);
    });

    test('should not call getCountries more than once', async () => {
        (getCountries as Mock).mockResolvedValue({
            countries: [],
        });

        const { rerender } = renderHook(() => useGeneralApi());

        expect(getCountries).toHaveBeenCalledTimes(1);

        rerender();

        expect(getCountries).toHaveBeenCalledTimes(1);
    });
});
