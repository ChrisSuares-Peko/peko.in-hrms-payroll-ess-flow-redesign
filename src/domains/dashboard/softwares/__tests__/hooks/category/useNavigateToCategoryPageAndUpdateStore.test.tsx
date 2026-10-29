/**
 * @file useNavigateToCategoryPageAndUpdateStore.test.tsx
 * @description Unit tests for useNavigateToCategoryPageAndUpdateStore hook.
 *
 * Test coverage:
 *  - Returns a navigateAndUpdateStore function
 *  - navigateAndUpdateStore dispatches setQueryParams with the given weburl
 *  - navigateAndUpdateStore navigates to the correct category URL
 *  - Works correctly with an empty string weburl
 *  - navigateAndUpdateStore reference is stable across re-renders
 */

import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import useNavigateToCategoryPageAndUpdateStore from '../../../hooks/category/useNavigateToCategoryPageAndUpdateStore';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
});

const mockSetQueryParams = vi.fn();
vi.mock('../../../slice/softwareSlice', () => ({
    setQueryParams: (...args: unknown[]) => {
        mockSetQueryParams(...args);
        return { type: 'software/setQueryParams', payload: args[0] };
    },
}));

// ---------------------------------------------------------------------------
// Redux store factory
// ---------------------------------------------------------------------------

const buildStore = () =>
    configureStore({
        reducer: {
            reducer: () => ({
                software: { queryParams: { category: '', product: '', search: '' } },
                auth: { role: 'buyer', id: 'user-1' },
            }),
        },
    });

// ---------------------------------------------------------------------------
// Wrapper helper
// ---------------------------------------------------------------------------

const createWrapper =
    (store = buildStore()) =>
    ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
            <MemoryRouter>{children}</MemoryRouter>
        </Provider>
    );

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useNavigateToCategoryPageAndUpdateStore', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    /**
     * @test Hook returns an object with a navigateAndUpdateStore function.
     */
    it('returns navigateAndUpdateStore as a function', () => {
        const { result } = renderHook(() => useNavigateToCategoryPageAndUpdateStore(), {
            wrapper: createWrapper(),
        });

        expect(typeof result.current.navigateAndUpdateStore).toBe('function');
    });

    /**
     * @test navigateAndUpdateStore dispatches setQueryParams with { category: weburl }.
     */
    it('dispatches setQueryParams with the given weburl', () => {
        const { result } = renderHook(() => useNavigateToCategoryPageAndUpdateStore(), {
            wrapper: createWrapper(),
        });

        act(() => {
            result.current.navigateAndUpdateStore('crm');
        });

        expect(mockSetQueryParams).toHaveBeenCalledWith({ category: 'crm' });
    });

    /**
     * @test navigateAndUpdateStore navigates to /softwares/category?weburl=<weburl>.
     */
    it('navigates to /softwares/category?weburl=<weburl>', () => {
        const { result } = renderHook(() => useNavigateToCategoryPageAndUpdateStore(), {
            wrapper: createWrapper(),
        });

        act(() => {
            result.current.navigateAndUpdateStore('erp');
        });

        expect(mockNavigate).toHaveBeenCalledWith('/softwares/category?weburl=erp');
    });

    /**
     * @test Both dispatch and navigate are called once per invocation.
     */
    it('calls dispatch and navigate exactly once per invocation', () => {
        const { result } = renderHook(() => useNavigateToCategoryPageAndUpdateStore(), {
            wrapper: createWrapper(),
        });

        act(() => {
            result.current.navigateAndUpdateStore('billing');
        });

        expect(mockSetQueryParams).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledTimes(1);
    });

    /**
     * @test Works correctly when called with an empty string weburl.
     */
    it('handles empty string weburl', () => {
        const { result } = renderHook(() => useNavigateToCategoryPageAndUpdateStore(), {
            wrapper: createWrapper(),
        });

        act(() => {
            result.current.navigateAndUpdateStore('');
        });

        expect(mockSetQueryParams).toHaveBeenCalledWith({ category: '' });
        expect(mockNavigate).toHaveBeenCalledWith('/softwares/category?weburl=');
    });

    /**
     * @test navigateAndUpdateStore reference is stable across re-renders (useCallback).
     */
    it('returns a stable navigateAndUpdateStore reference across re-renders', () => {
        const { result, rerender } = renderHook(() => useNavigateToCategoryPageAndUpdateStore(), {
            wrapper: createWrapper(),
        });

        const firstRef = result.current.navigateAndUpdateStore;
        rerender();
        expect(result.current.navigateAndUpdateStore).toBe(firstRef);
    });

    /**
     * @test Multiple calls with different weburls each dispatch and navigate correctly.
     */
    it('handles multiple calls with different weburls', () => {
        const { result } = renderHook(() => useNavigateToCategoryPageAndUpdateStore(), {
            wrapper: createWrapper(),
        });

        act(() => {
            result.current.navigateAndUpdateStore('crm');
            result.current.navigateAndUpdateStore('erp');
        });

        expect(mockSetQueryParams).toHaveBeenNthCalledWith(1, { category: 'crm' });
        expect(mockSetQueryParams).toHaveBeenNthCalledWith(2, { category: 'erp' });
        expect(mockNavigate).toHaveBeenNthCalledWith(1, '/softwares/category?weburl=crm');
        expect(mockNavigate).toHaveBeenNthCalledWith(2, '/softwares/category?weburl=erp');
    });
});
