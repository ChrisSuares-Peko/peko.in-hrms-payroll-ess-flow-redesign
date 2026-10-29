import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { getTopUpPackagesList } from '@src/domains/dashboard/esim/api/index'; // Ensure the path is correct
import useGetTopUpPackages from '@src/domains/dashboard/esim/hooks/useSearchTopUpPackages'; // Ensure the path is correct
import { useAppSelector } from '@src/hooks/store'; // Mock the store hook

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

vi.mock('@src/domains/dashboard/esim/api', () => ({
    getTopUpPackagesList: vi.fn(), // Correctly mock this function
}));

describe('useGetTopUpPackages', () => {
    const mockSelector = {
        role: 'user',
        id: 'user123',
    };

    const mockTopUpData = {
        planList: [
            { id: '1', name: 'Top Up Plan 1' },
            { id: '2', name: 'Top Up Plan 2' },
        ],
        usdToINR: 3.67,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as any).mockReturnValue(mockSelector);
    });

    it('should fetch and set the top-up packages list successfully', async () => {
        // Use mockResolvedValueOnce to simulate successful API response
        (getTopUpPackagesList as any).mockResolvedValueOnce(mockTopUpData);

        const { result } = renderHook(() => useGetTopUpPackages('iccid123'));

        // Initially, isLoading should be true
        expect(result.current.isLoading).toBe(true);

        // Wait for the data to be fetched
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        // After the API call, verify the fetched data
        expect(result.current.data).toEqual([
            { id: '1', name: 'Top Up Plan 1' },
            { id: '2', name: 'Top Up Plan 2' },
        ]);

        // Verify total packages and conversion rate
        expect(result.current.packagesTotal).toBe(2);
        expect(result.current.conversionRate).toBe(3.67);
    });

    it('should handle API failure gracefully', async () => {
        // Simulate API returning `false`
        (getTopUpPackagesList as any).mockResolvedValueOnce(false);

        const { result } = renderHook(() => useGetTopUpPackages('iccid123'));

        // Initially, isLoading should be true
        expect(result.current.isLoading).toBe(true);

        // Wait for the API call to fail
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        // Verify that no data is set on API failure
        expect(result.current.data).toBeUndefined();
        expect(result.current.packagesTotal).toBeUndefined();
        expect(result.current.conversionRate).toBe(1); // Default conversion rate
    });

    it('should handle slow API responses correctly', async () => {
        // Mock a slow API call with a delay
        (getTopUpPackagesList as any).mockImplementationOnce(
            () => new Promise(resolve => setTimeout(() => resolve(mockTopUpData), 100))
        );

        const { result } = renderHook(() => useGetTopUpPackages('iccid123'));

        // Initially, isLoading should be true
        expect(result.current.isLoading).toBe(true);

        // Wait for the API call to complete
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        // Verify the data after API resolves
        expect(result.current.data).toEqual([
            { id: '1', name: 'Top Up Plan 1' },
            { id: '2', name: 'Top Up Plan 2' },
        ]);

        // Verify total packages and conversion rate
        expect(result.current.packagesTotal).toBe(2);
        expect(result.current.conversionRate).toBe(3.67);
    });
});
