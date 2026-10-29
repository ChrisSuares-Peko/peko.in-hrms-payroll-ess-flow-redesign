import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { getPackagesList } from '@domains/dashboard/esim/api'; // Path alias for API
import useSearchPackages from '@domains/dashboard/esim/hooks/useSearchPackages'; // Path alias for hook
import { useAppSelector } from '@src/hooks/store'; // Path alias for store hook

// Mock the necessary imports
vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

vi.mock('@domains/dashboard/esim/api', () => ({
    getPackagesList: vi.fn(),
}));

describe('useSearchPackages', () => {
    const mockSelector = {
        role: 'user',
        id: 'user123',
    };

    const mockPackagesData = {
        packages: [
            { id: '1', name: 'Package 1', slug: 'pakistan' },
            { id: '2', name: 'Package 2', slug: 'afghanistan' }, // This should be filtered out
            { id: '3', name: 'Package 3', slug: 'india' },
        ],
        usdToINR: 3.67,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as any).mockReturnValue(mockSelector);
    });

    it('should fetch and filter the packages list successfully', async () => {
        (getPackagesList as any).mockResolvedValueOnce(mockPackagesData);

        const { result } = renderHook(() => useSearchPackages('UAE', 'local'));

        // Initially, isLoading should be true
        expect(result.current.isLoading).toBe(true);

        // Wait for the data to be fetched
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        // After the API call, verify the filtered packages
        expect(result.current.data).toEqual([
            { id: '1', name: 'Package 1', slug: 'pakistan' },
            { id: '3', name: 'Package 3', slug: 'india' },
        ]);

        // Verify that the conversion rate is set correctly
        expect(result.current.conversionRate).toBe(3.67);
    });

    it('should handle API failure gracefully', async () => {
        // Simulate API returning `false`
        (getPackagesList as any).mockResolvedValueOnce(false);

        const { result } = renderHook(() => useSearchPackages('UAE', 'local'));

        // Initially, isLoading should be true
        expect(result.current.isLoading).toBe(true);

        // Wait for the API call to fail
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        // Verify that no data is set on API failure
        expect(result.current.data).toBeUndefined();
        expect(result.current.conversionRate).toBe(1); // Default conversion rate
    });

    it('should handle slow API responses correctly', async () => {
        // Mock a slow API call with a delay
        (getPackagesList as any).mockImplementationOnce(
            () => new Promise(resolve => setTimeout(() => resolve(mockPackagesData), 100))
        );

        const { result } = renderHook(() => useSearchPackages('UAE', 'local'));

        // Initially, isLoading should be true
        expect(result.current.isLoading).toBe(true);

        // Wait for the API call to complete
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        // Verify the data after API resolves
        expect(result.current.data).toEqual([
            { id: '1', name: 'Package 1', slug: 'pakistan' },
            { id: '3', name: 'Package 3', slug: 'india' },
        ]);
    });
});
