/**
 * @file useResetresetRecommendedProducts.test.tsx
 * @description Unit tests for useResetRecommendedProducts hook.
 *
 * Test coverage:
 *  - Dispatches resetSoftwareRecommendedProducts once on mount
 *  - Does not dispatch again on subsequent re-renders
 *  - Does not dispatch again on unmount
 */

import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import useResetRecommendedProducts from '../../../hooks/general/useResetRecommendedProducts';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockDispatch = vi.fn();
vi.mock('react-redux', async () => {
    const actual = await vi.importActual<typeof import('react-redux')>('react-redux');
    return {
        ...actual,
        useDispatch: () => mockDispatch,
    };
});

const mockResetSoftwareRecommendedProducts = vi.fn(() => ({
    type: 'software/resetSoftwareRecommendedProducts',
}));
vi.mock('../../../slice/softwareSlice', () => ({
    resetSoftwareRecommendedProducts: () => mockResetSoftwareRecommendedProducts(),
}));

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const buildStore = () =>
    configureStore({
        reducer: {
            reducer: () => ({}),
        },
    });

const makeWrapper = () => {
    const store = buildStore();
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
    );
    return Wrapper;
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useResetRecommendedProducts', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    /**
     * @test Dispatches resetSoftwareRecommendedProducts exactly once on mount.
     */
    it('dispatches resetSoftwareRecommendedProducts once on mount', () => {
        renderHook(() => useResetRecommendedProducts(), { wrapper: makeWrapper() });

        expect(mockDispatch).toHaveBeenCalledTimes(1);
        expect(mockDispatch).toHaveBeenCalledWith({
            type: 'software/resetSoftwareRecommendedProducts',
        });
    });

    /**
     * @test Does not dispatch again on re-render (effect has no changing deps).
     */
    it('does not dispatch again on re-render', () => {
        const { rerender } = renderHook(() => useResetRecommendedProducts(), {
            wrapper: makeWrapper(),
        });

        rerender();
        rerender();

        expect(mockDispatch).toHaveBeenCalledTimes(1);
    });

    /**
     * @test Does not dispatch again after unmount.
     */
    it('does not dispatch again after unmount', () => {
        const { unmount } = renderHook(() => useResetRecommendedProducts(), {
            wrapper: makeWrapper(),
        });

        unmount();

        expect(mockDispatch).toHaveBeenCalledTimes(1);
    });
});
