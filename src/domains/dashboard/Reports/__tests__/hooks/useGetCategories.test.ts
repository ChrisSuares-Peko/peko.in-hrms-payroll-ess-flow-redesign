import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { categoryListing } from '../../api/index';
import { useGetCategories } from '../../hooks/useGetCategories';

// Mock API response
const mockCategoryData = {
    category: [
        { label: 'Electronics', value: 'electronics' },
        { label: 'Groceries', value: 'groceries' },
    ],
};

// Mock the API call
vi.mock('../../api/index', () => ({
    categoryListing: vi.fn(),
}));

describe('useGetCategories Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetches categories and updates state correctly', async () => {
        // Mock API response
        (categoryListing as any).mockResolvedValue(mockCategoryData);

        // Render hook
        const { result } = renderHook(() => useGetCategories());

        // Verify initial state
        expect(result.current.categoryLoader).toBe(true);
        expect(result.current.category).toEqual([]);

        // Wait for data fetch
        await act(async () => {});

        // Verify updated state
        expect(result.current.categoryLoader).toBe(false);
        expect(result.current.category).toEqual([
            { label: 'Electronics', value: 'electronics' },
            { label: 'Groceries', value: 'groceries' },
        ]);
    });

    it('handles API failure gracefully', async () => {
        // Mock API failure response
        (categoryListing as any).mockResolvedValue(false);

        // Render hook
        const { result } = renderHook(() => useGetCategories());

        // Wait for data fetch
        await act(async () => {});

        // Verify state after failure
        expect(result.current.categoryLoader).toBe(false);
        expect(result.current.category).toEqual([]);
    });
});
