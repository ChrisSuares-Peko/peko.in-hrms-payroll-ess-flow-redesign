/**
 * @file useNavigateFromProductPage.test.tsx
 * @description Unit tests for useNavigateFromProductPage hook.
 *
 * Test coverage:
 *  - Navigates to /softwares when fromWhere is paths.softwares.index
 *  - Navigates to /softwares/category when fromWhere is paths.softwares.category
 *  - Navigates to /softwares/search-results when fromWhere is paths.softwares.searchResults
 *  - Navigates to /softwares (default) for any unrecognised fromWhere value
 *  - All navigations use { replace: true }
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import useNavigateFromProductPage from '../../../hooks/product/useNavigateFromProductPage';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
});

const mockUseFromWhere = vi.fn();
vi.mock('../../../hooks/general/useFromWhere', () => ({
    default: (...args: unknown[]) => mockUseFromWhere(...args),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useNavigateFromProductPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    /**
     * @test Navigates to /softwares when fromWhere equals paths.softwares.index.
     */
    it('navigates to /softwares when fromWhere is "softwares"', () => {
        mockUseFromWhere.mockReturnValue('softwares');

        const { result } = renderHook(() => useNavigateFromProductPage());

        act(() => {
            result.current.navigateFromProductPage();
        });

        expect(mockNavigate).toHaveBeenCalledWith('/softwares', { replace: true });
    });

    /**
     * @test Navigates to /softwares/category when fromWhere equals paths.softwares.category.
     */
    it('navigates to /softwares/category when fromWhere is "category"', () => {
        mockUseFromWhere.mockReturnValue('category');

        const { result } = renderHook(() => useNavigateFromProductPage());

        act(() => {
            result.current.navigateFromProductPage();
        });

        expect(mockNavigate).toHaveBeenCalledWith('/softwares/category', { replace: true });
    });

    /**
     * @test Navigates to /softwares/search-results when fromWhere equals paths.softwares.searchResults.
     */
    it('navigates to /softwares/search-results when fromWhere is "search-results"', () => {
        mockUseFromWhere.mockReturnValue('search-results');

        const { result } = renderHook(() => useNavigateFromProductPage());

        act(() => {
            result.current.navigateFromProductPage();
        });

        expect(mockNavigate).toHaveBeenCalledWith('/softwares/search-results', { replace: true });
    });

    /**
     * @test Falls back to /softwares for any unrecognised fromWhere value.
     */
    it('navigates to /softwares by default for an unknown fromWhere value', () => {
        mockUseFromWhere.mockReturnValue('unknown-route');

        const { result } = renderHook(() => useNavigateFromProductPage());

        act(() => {
            result.current.navigateFromProductPage();
        });

        expect(mockNavigate).toHaveBeenCalledWith('/softwares', { replace: true });
    });

    /**
     * @test useFromWhere is called with position 1.
     */
    it('calls useFromWhere with position 1', () => {
        mockUseFromWhere.mockReturnValue('softwares');

        renderHook(() => useNavigateFromProductPage());

        expect(mockUseFromWhere).toHaveBeenCalledWith(1);
    });
});
