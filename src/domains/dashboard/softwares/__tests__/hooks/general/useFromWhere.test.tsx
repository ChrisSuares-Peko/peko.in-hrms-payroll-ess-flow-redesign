/**
 * @file useFromWhere.test.tsx
 * @description Unit tests for useFromWhere hook.
 *
 * Test coverage:
 *  - Returns the segment at position 2 from a 2-segment path (/a/b → 'a')
 *  - Returns the segment at position 2 from a 3-segment path (/a/b/c → 'b')
 *  - Returns the last segment when position is 1
 *  - Returns the root-level segment for the softwares index route
 *  - Returns 'category' for a category-level route
 *  - Returns undefined when position exceeds the number of segments
 *  - Returns an empty string for the root path '/'
 */

import React from 'react';

import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';

import useFromWhere from '../../../hooks/general/useFromWhere';

// ---------------------------------------------------------------------------
// Wrapper helper
// ---------------------------------------------------------------------------

const createWrapper =
    (pathname: string) =>
    ({ children }: { children: React.ReactNode }) => (
        <MemoryRouter initialEntries={[pathname]}>{children}</MemoryRouter>
    );

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useFromWhere', () => {
    /**
     * @test Returns the second-to-last segment when position is 2 on a 2-segment path.
     * pathname = '/softwares/search-results'
     * routes   = ['', 'softwares', 'search-results']  (length 3)
     * index    = 3 - 2 = 1  →  'softwares'
     */
    it('returns the parent segment (position 2) from a 2-segment path', () => {
        const { result } = renderHook(() => useFromWhere(2), {
            wrapper: createWrapper('/softwares/search-results'),
        });

        expect(result.current).toBe('softwares');
    });

    /**
     * @test Returns the correct segment at position 2 from a 3-segment path.
     * pathname = '/softwares/category/search-results'
     * routes   = ['', 'softwares', 'category', 'search-results']  (length 4)
     * index    = 4 - 2 = 2  →  'category'
     */
    it('returns the correct segment (position 2) from a 3-segment path', () => {
        const { result } = renderHook(() => useFromWhere(2), {
            wrapper: createWrapper('/softwares/category/search-results'),
        });

        expect(result.current).toBe('category');
    });

    /**
     * @test Returns the last segment when position is 1.
     * pathname = '/softwares/category'
     * routes   = ['', 'softwares', 'category']  (length 3)
     * index    = 3 - 1 = 2  →  'category'
     */
    it('returns the last segment when position is 1', () => {
        const { result } = renderHook(() => useFromWhere(1), {
            wrapper: createWrapper('/softwares/category'),
        });

        expect(result.current).toBe('category');
    });

    /**
     * @test Returns the softwares index segment for the top-level softwares route.
     * pathname = '/softwares'
     * routes   = ['', 'softwares']  (length 2)
     * index    = 2 - 1 = 1  →  'softwares'
     */
    it('returns "softwares" for the top-level softwares route at position 1', () => {
        const { result } = renderHook(() => useFromWhere(1), {
            wrapper: createWrapper('/softwares'),
        });

        expect(result.current).toBe('softwares');
    });

    /**
     * @test Returns undefined when position exceeds the number of segments.
     * pathname = '/softwares'
     * routes   = ['', 'softwares']  (length 2)
     * index    = 2 - 5 = -3  →  undefined
     */
    it('returns undefined when position exceeds the segment count', () => {
        const { result } = renderHook(() => useFromWhere(5), {
            wrapper: createWrapper('/softwares'),
        });

        expect(result.current).toBeUndefined();
    });

    /**
     * @test Returns an empty string for the root path '/'.
     * pathname = '/'
     * routes   = ['', '']  (length 2)
     * index    = 2 - 1 = 1  →  ''
     */
    it('returns an empty string for the root path at position 1', () => {
        const { result } = renderHook(() => useFromWhere(1), {
            wrapper: createWrapper('/'),
        });

        expect(result.current).toBe('');
    });

    /**
     * @test Works correctly for a deeply nested path.
     * pathname = '/dashboard/softwares/category/search-results'
     * routes   = ['', 'dashboard', 'softwares', 'category', 'search-results']  (length 5)
     * index    = 5 - 3 = 2  →  'softwares'
     */
    it('returns the correct segment from a deeply nested path', () => {
        const { result } = renderHook(() => useFromWhere(3), {
            wrapper: createWrapper('/dashboard/softwares/category/search-results'),
        });

        expect(result.current).toBe('softwares');
    });

    /**
     * @test Returns the segment at position 0, which is always out of bounds (undefined).
     * routes[length - 0] = routes[length] → undefined
     */
    it('returns undefined when position is 0', () => {
        const { result } = renderHook(() => useFromWhere(0), {
            wrapper: createWrapper('/softwares/category'),
        });

        expect(result.current).toBeUndefined();
    });
});
