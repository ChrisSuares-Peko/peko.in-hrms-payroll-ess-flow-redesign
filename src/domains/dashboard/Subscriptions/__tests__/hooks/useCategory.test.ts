import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, Mock, test, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { getCategories } from '../../api';
import { useGetCategories } from '../../hooks/useCategory';

// Mock the dependencies
vi.mock('../../api/index', () => ({
    getCategories: vi.fn(),
}));

// Mock useAppSelector globally
vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

describe('use Category hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    afterEach(() => {
        cleanup();
    });
    test('should set loading to true initially and to false after fetching', async () => {
        const mockCategories = [{ id: '1', name: 'Category 1' }];
        (getCategories as Mock).mockResolvedValue({ categoryData: mockCategories });
        (useAppSelector as Mock).mockImplementation(selector =>
            selector({
                reducer: {
                    auth: { role: 'user', id: '123' },
                },
            })
        );
        const { result } = renderHook(() => useGetCategories());

        expect(result.current.Loading).toBe(true);

        // Use `waitFor` to wait for the loading state to change
        await waitFor(() => {
            expect(result.current.Loading).toBe(false);
            expect(result.current.CategoryData).toEqual(mockCategories);
        });
    });

    test('should set category data correctly after fetching', async () => {
        const mockCategories = [{ id: '1', name: 'Category 1' }];
        (getCategories as Mock).mockResolvedValue({ categoryData: mockCategories });

        const { result } = renderHook(() => useGetCategories());

        // Wait for the async operation to complete and state to update
        await waitFor(() => {
            expect(result.current.CategoryData).toEqual(mockCategories);
        });
    });

    test('should handle error when getCategories returns false', async () => {
        (getCategories as Mock).mockResolvedValue(false);

        const { result } = renderHook(() => useGetCategories());

        await waitFor(() => {
            // Check if CategoryData is an empty array when getCategories returns false
            expect(result.current.CategoryData).toEqual([]);
            expect(result.current.Loading).toBe(false);
        });
    });

    test('should call getCategories when id or role changes', async () => {
        const getCategoriesMock = vi.fn();
        (getCategories as Mock).mockImplementation(getCategoriesMock);

        // Initial mock setup for useAppSelector
        (useAppSelector as Mock).mockImplementation(selector =>
            selector({
                reducer: {
                    auth: { role: 'user', id: '123' },
                },
            })
        );

        // Render the hook
        const { rerender } = renderHook(() => useGetCategories());

        // Wait for the initial fetch
        await waitFor(() => {
            expect(getCategoriesMock).toHaveBeenCalledWith({
                userId: '123',
                userType: 'user',
            });
        });

        // Update mock to simulate role and id change
        (useAppSelector as Mock).mockImplementation(selector =>
            selector({
                reducer: {
                    auth: { role: 'admin', id: '456' },
                },
            })
        );

        // Rerender to simulate prop change
        rerender();

        // Wait for the fetch to occur after rerender
        await waitFor(() => {
            expect(getCategoriesMock).toHaveBeenCalledWith({
                userId: '456',
                userType: 'admin',
            });
        });
    });
});
