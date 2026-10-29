/**
 * @file useResetQueryParams.test.tsx
 * @description Unit tests for useResetQueryParams hook.
 *
 * Test coverage:
 *  - Dispatches resetSoftwareQueryParams once on mount
 *  - Does not dispatch again on subsequent re-renders
 *  - Does not dispatch again on unmount
 */

import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import useResetQueryParams from '../../../hooks/general/useResetQueryParams';

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

const mockResetSoftwareQueryParams = vi.fn(() => ({ type: 'software/resetSoftwareQueryParams' }));
vi.mock('../../../slice/softwareSlice', () => ({
    resetSoftwareQueryParams: () => mockResetSoftwareQueryParams(),
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

describe('useResetQueryParams', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    /**
     * @test Dispatches resetSoftwareQueryParams exactly once on mount.
     */
    it('dispatches resetSoftwareQueryParams once on mount', () => {
        renderHook(() => useResetQueryParams(), { wrapper: makeWrapper() });

        expect(mockDispatch).toHaveBeenCalledTimes(1);
        expect(mockDispatch).toHaveBeenCalledWith({ type: 'software/resetSoftwareQueryParams' });
    });

    /**
     * @test Does not dispatch again on re-render (effect has no changing deps).
     */
    it('does not dispatch again on re-render', () => {
        const { rerender } = renderHook(() => useResetQueryParams(), { wrapper: makeWrapper() });

        rerender();
        rerender();

        expect(mockDispatch).toHaveBeenCalledTimes(1);
    });

    /**
     * @test Does not dispatch again after unmount.
     */
    it('does not dispatch again after unmount', () => {
        const { unmount } = renderHook(() => useResetQueryParams(), { wrapper: makeWrapper() });

        unmount();

        expect(mockDispatch).toHaveBeenCalledTimes(1);
    });
});
