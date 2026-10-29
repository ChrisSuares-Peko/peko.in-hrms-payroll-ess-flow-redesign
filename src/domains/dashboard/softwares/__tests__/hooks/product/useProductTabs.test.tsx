/**
 * @file useProductTabs.test.tsx
 * @description Unit tests for useProductTabs hook.
 *
 * Test coverage:
 *  - Returns 4 base tabs when accessibleImages is empty
 *  - Returns 5 tabs (including Product Images) when accessibleImages is non-empty
 *  - Tab keys and labels are correct
 *  - onTabChange calls setPlayingVideoIndex with null
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useProductTabs } from '../../../hooks/product/useProductTabs';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockSetPlayingVideoIndex = vi.fn();

const mockUseProductContext = vi.fn();
vi.mock('../../../contexts/ProductContext', () => ({
    useProductContext: () => mockUseProductContext(),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const buildContext = (accessibleImages: string[] = []) => ({
    accessibleImages,
    setPlayingVideoIndex: mockSetPlayingVideoIndex,
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useProductTabs', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // -------------------------------------------------------------------------
    // Tab count
    // -------------------------------------------------------------------------

    /**
     * @test Returns 4 base tabs when accessibleImages is empty.
     */
    it('returns 4 tabs when accessibleImages is empty', () => {
        mockUseProductContext.mockReturnValue(buildContext([]));

        const { result } = renderHook(() => useProductTabs());

        expect(result.current.tabItems).toHaveLength(4);
    });

    /**
     * @test Returns 5 tabs when accessibleImages contains at least one image.
     */
    it('returns 5 tabs when accessibleImages is non-empty', () => {
        mockUseProductContext.mockReturnValue(buildContext(['https://example.com/img1.png']));

        const { result } = renderHook(() => useProductTabs());

        expect(result.current.tabItems).toHaveLength(5);
    });

    // -------------------------------------------------------------------------
    // Tab keys and labels
    // -------------------------------------------------------------------------

    /**
     * @test Base tabs have correct keys and labels.
     */
    it('has correct keys and labels for the 4 base tabs', () => {
        mockUseProductContext.mockReturnValue(buildContext([]));

        const { result } = renderHook(() => useProductTabs());

        const tabs = result.current.tabItems!;
        expect(tabs[0]).toMatchObject({ key: '1', label: 'Overview' });
        expect(tabs[1]).toMatchObject({ key: '2', label: 'Features' });
        expect(tabs[2]).toMatchObject({ key: '3', label: 'Integrations' });
        expect(tabs[3]).toMatchObject({ key: '4', label: 'Ratings' });
    });

    /**
     * @test Product Images tab has key "5" and correct label when images are present.
     */
    it('5th tab has key "5" and label "Product Images" when images are present', () => {
        mockUseProductContext.mockReturnValue(
            buildContext(['https://example.com/img1.png', 'https://example.com/img2.png'])
        );

        const { result } = renderHook(() => useProductTabs());

        const lastTab = result.current.tabItems![4];
        expect(lastTab).toMatchObject({ key: '5', label: 'Product Images' });
    });

    // -------------------------------------------------------------------------
    // onTabChange
    // -------------------------------------------------------------------------

    /**
     * @test onTabChange calls setPlayingVideoIndex with null regardless of the key passed.
     */
    it('onTabChange calls setPlayingVideoIndex(null)', () => {
        mockUseProductContext.mockReturnValue(buildContext([]));

        const { result } = renderHook(() => useProductTabs());

        act(() => {
            result.current.onTabChange('2');
        });

        expect(mockSetPlayingVideoIndex).toHaveBeenCalledWith(null);
        expect(mockSetPlayingVideoIndex).toHaveBeenCalledTimes(1);
    });

    /**
     * @test onTabChange calls setPlayingVideoIndex(null) for every tab key.
     */
    it('onTabChange calls setPlayingVideoIndex(null) for any tab key', () => {
        mockUseProductContext.mockReturnValue(buildContext([]));

        const { result } = renderHook(() => useProductTabs());

        ['1', '2', '3', '4'].forEach(key => {
            act(() => {
                result.current.onTabChange(key);
            });
        });

        expect(mockSetPlayingVideoIndex).toHaveBeenCalledTimes(4);
        expect(mockSetPlayingVideoIndex).toHaveBeenNthCalledWith(1, null);
        expect(mockSetPlayingVideoIndex).toHaveBeenNthCalledWith(4, null);
    });
});
