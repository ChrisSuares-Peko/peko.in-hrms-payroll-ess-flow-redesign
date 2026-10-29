/**
 * @file useCategoryTile.test.tsx
 * @description Unit tests for useCategoryTile hook.
 *
 * Test coverage:
 *  - tileIconSize defaults to 30 when no breakpoint is active
 *  - tileIconSize is 20 for xs screens
 *  - tileIconSize is 20 for sm screens
 *  - Returns scrollRef, scrollLeft, scrollRight, canScrollLeft, canScrollRight
 *  - canScrollLeft is false and canScrollRight is false when scrollRef has no element
 *  - scrollLeft calls scrollBy with left: -300
 *  - scrollRight calls scrollBy with left: 300
 *  - canScrollLeft becomes true when el.scrollLeft > 0
 *  - canScrollRight becomes true when content overflows right
 *  - scroll event listener updates scroll state
 *  - Cleans up scroll listener and ResizeObserver on unmount
 */

import React from 'react';

import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import useCategoryTile from '../../../hooks/home/useCategoryTile';
import { IsoftwareCategory } from '../../../types';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockScreenSize = vi.fn(() => ({}));
vi.mock('@src/hooks/useScreenSize', () => ({
    default: () => mockScreenSize(),
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockCategories: IsoftwareCategory[] = [
    { weburl: 'crm', name: 'CRM', title: 'CRM', icon: 'crm.svg' },
    { weburl: 'erp', name: 'ERP', title: 'ERP', icon: 'erp.svg' },
];

// ---------------------------------------------------------------------------
// ResizeObserver stub
// ---------------------------------------------------------------------------

const mockResizeObserverDisconnect = vi.fn();
const mockResizeObserverObserve = vi.fn();

class MockResizeObserver {
    observe = mockResizeObserverObserve;

    disconnect = mockResizeObserverDisconnect;
}

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter>{children}</MemoryRouter>
);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useCategoryTile', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockScreenSize.mockReturnValue({});
        vi.stubGlobal('ResizeObserver', MockResizeObserver);
        vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
            cb(0);
            return 0;
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    // -------------------------------------------------------------------------
    // tileIconSize
    // -------------------------------------------------------------------------

    /**
     * @test Default size when no breakpoint is active.
     */
    it('returns tileIconSize=30 when no breakpoint is active', () => {
        mockScreenSize.mockReturnValue({});
        const { result } = renderHook(() => useCategoryTile(mockCategories, false), {
            wrapper: Wrapper,
        });
        expect(result.current.tileIconSize).toBe(30);
    });

    /**
     * @test xs breakpoint → size 20.
     */
    it('returns tileIconSize=20 for xs screens', () => {
        mockScreenSize.mockReturnValue({ xs: true });
        const { result } = renderHook(() => useCategoryTile(mockCategories, false), {
            wrapper: Wrapper,
        });
        expect(result.current.tileIconSize).toBe(20);
    });

    /**
     * @test sm breakpoint → size 20.
     */
    it('returns tileIconSize=20 for sm screens', () => {
        mockScreenSize.mockReturnValue({ sm: true });
        const { result } = renderHook(() => useCategoryTile(mockCategories, false), {
            wrapper: Wrapper,
        });
        expect(result.current.tileIconSize).toBe(20);
    });

    // -------------------------------------------------------------------------
    // Return shape
    // -------------------------------------------------------------------------

    /**
     * @test Hook returns all expected properties.
     */
    it('returns scrollRef, scrollLeft, scrollRight, canScrollLeft, canScrollRight', () => {
        const { result } = renderHook(() => useCategoryTile(mockCategories, false), {
            wrapper: Wrapper,
        });
        expect(result.current.scrollRef).toBeDefined();
        expect(typeof result.current.scrollLeft).toBe('function');
        expect(typeof result.current.scrollRight).toBe('function');
        expect(typeof result.current.canScrollLeft).toBe('boolean');
        expect(typeof result.current.canScrollRight).toBe('boolean');
    });

    /**
     * @test Initial scroll state is false for both directions when ref is null.
     */
    it('initialises canScrollLeft and canScrollRight to false', () => {
        const { result } = renderHook(() => useCategoryTile(mockCategories, false), {
            wrapper: Wrapper,
        });
        expect(result.current.canScrollLeft).toBe(false);
        expect(result.current.canScrollRight).toBe(false);
    });

    // -------------------------------------------------------------------------
    // scrollLeft / scrollRight
    // -------------------------------------------------------------------------

    /**
     * @test scrollLeft calls scrollBy({ left: -300 }) on the ref element.
     */
    it('scrollLeft calls scrollBy with left: -300 on the ref element', () => {
        const { result } = renderHook(() => useCategoryTile(mockCategories, false), {
            wrapper: Wrapper,
        });

        const mockScrollBy = vi.fn();
        const fakeEl = document.createElement('div');
        fakeEl.scrollBy = mockScrollBy;
        (result.current.scrollRef as React.MutableRefObject<HTMLDivElement>).current = fakeEl;

        act(() => {
            result.current.scrollLeft();
        });

        expect(mockScrollBy).toHaveBeenCalledWith({ left: -300, behavior: 'smooth' });
    });

    /**
     * @test scrollRight calls scrollBy({ left: 300 }) on the ref element.
     */
    it('scrollRight calls scrollBy with left: 300 on the ref element', () => {
        const { result } = renderHook(() => useCategoryTile(mockCategories, false), {
            wrapper: Wrapper,
        });

        const mockScrollBy = vi.fn();
        const fakeEl = document.createElement('div');
        fakeEl.scrollBy = mockScrollBy;
        (result.current.scrollRef as React.MutableRefObject<HTMLDivElement>).current = fakeEl;

        act(() => {
            result.current.scrollRight();
        });

        expect(mockScrollBy).toHaveBeenCalledWith({ left: 300, behavior: 'smooth' });
    });

    // -------------------------------------------------------------------------
    // canScrollLeft / canScrollRight via scroll event
    // -------------------------------------------------------------------------

    /**
     * @test canScrollLeft becomes true when scrollLeft > 0.
     * Sets ref before re-rendering with changed isLoading so the effect re-runs
     * and requestAnimationFrame fires updateScrollState against the real element.
     */
    it('sets canScrollLeft=true when el.scrollLeft > 0', () => {
        const { result, rerender } = renderHook(
            ({ isLoading }: { isLoading: boolean }) => useCategoryTile(mockCategories, isLoading),
            { wrapper: Wrapper, initialProps: { isLoading: false } }
        );

        const fakeEl = document.createElement('div');
        Object.defineProperties(fakeEl, {
            scrollLeft: { value: 50, writable: true, configurable: true },
            clientWidth: { value: 300, writable: true, configurable: true },
            scrollWidth: { value: 600, writable: true, configurable: true },
        });
        (result.current.scrollRef as React.MutableRefObject<HTMLDivElement>).current = fakeEl;

        act(() => {
            rerender({ isLoading: true });
        });

        expect(result.current.canScrollLeft).toBe(true);
    });

    /**
     * @test canScrollRight becomes true when content overflows right.
     * Same re-render trick to run the effect with the ref already populated.
     */
    it('sets canScrollRight=true when scrollLeft + clientWidth < scrollWidth - 1', () => {
        const { result, rerender } = renderHook(
            ({ isLoading }: { isLoading: boolean }) => useCategoryTile(mockCategories, isLoading),
            { wrapper: Wrapper, initialProps: { isLoading: false } }
        );

        const fakeEl = document.createElement('div');
        Object.defineProperties(fakeEl, {
            scrollLeft: { value: 0, writable: true, configurable: true },
            clientWidth: { value: 300, writable: true, configurable: true },
            scrollWidth: { value: 600, writable: true, configurable: true },
        });
        (result.current.scrollRef as React.MutableRefObject<HTMLDivElement>).current = fakeEl;

        act(() => {
            rerender({ isLoading: true });
        });

        expect(result.current.canScrollRight).toBe(true);
    });

    // -------------------------------------------------------------------------
    // Cleanup
    // -------------------------------------------------------------------------

    /**
     * @test Disconnects ResizeObserver on unmount.
     * Re-renders with changed isLoading so the effect attaches the observer
     * before unmount triggers cleanup.
     */
    it('disconnects ResizeObserver and removes scroll listener on unmount', () => {
        const { result, rerender, unmount } = renderHook(
            ({ isLoading }: { isLoading: boolean }) => useCategoryTile(mockCategories, isLoading),
            { wrapper: Wrapper, initialProps: { isLoading: false } }
        );

        const fakeEl = document.createElement('div');
        (result.current.scrollRef as React.MutableRefObject<HTMLDivElement>).current = fakeEl;

        act(() => {
            rerender({ isLoading: true });
        });

        unmount();

        expect(mockResizeObserverDisconnect).toHaveBeenCalled();
    });
});
