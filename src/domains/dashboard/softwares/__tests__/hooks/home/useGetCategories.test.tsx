/**
 * @file useGetCategories.test.tsx
 * @description Unit tests for useGetCategories hook.
 *
 * Test coverage:
 *  - Returns categoryList and isLoading on mount
 *  - Fetches parent categories when categoryList is empty
 *  - Dispatches setCategoryList with API response on success
 *  - Does not fetch when categoryList already has items
 *  - Sets isLoading=true during fetch and false after
 *  - Does not dispatch when API returns false (failure)
 */

import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import useGetCategories from '../../../hooks/home/useGetCategories';

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

const mockFetchParentCategories = vi.fn();
vi.mock('../../../api', () => ({
    fetchParentCategories: (...args: unknown[]) => mockFetchParentCategories(...args),
}));

const mockSetCategoryList = vi.fn((payload: unknown) => ({
    type: 'software/setCategoryList',
    payload,
}));
vi.mock('../../../slice/softwareSlice', () => ({
    setCategoryList: (payload: unknown) => mockSetCategoryList(payload),
}));

// ---------------------------------------------------------------------------
// Store factory
// ---------------------------------------------------------------------------

const buildStore = (categoryList: unknown[] = []) =>
    configureStore({
        reducer: {
            reducer: () => ({
                auth: { id: 'user-1', role: 'buyer' },
                software: { categoryList },
            }),
        },
    });

const makeWrapper = (categoryList: unknown[] = []) => {
    const store = buildStore(categoryList);
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
    );
    return Wrapper;
};

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockCategoryList = [
    { weburl: 'crm', name: 'CRM', title: 'CRM', icon: 'crm.svg' },
    { weburl: 'erp', name: 'ERP', title: 'ERP', icon: 'erp.svg' },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useGetCategories', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    /**
     * @test Returns categoryList from store and isLoading=false on mount when list is pre-populated.
     */
    it('returns categoryList and isLoading=false when store already has categories', async () => {
        mockFetchParentCategories.mockResolvedValue({ categoryList: mockCategoryList });

        const { result } = renderHook(() => useGetCategories(), {
            wrapper: makeWrapper(mockCategoryList),
        });

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.categoryList).toEqual(mockCategoryList);
    });

    /**
     * @test Calls fetchParentCategories with userId and userType when categoryList is empty.
     */
    it('fetches parent categories when categoryList is empty', async () => {
        mockFetchParentCategories.mockResolvedValue({ categoryList: mockCategoryList });

        renderHook(() => useGetCategories(), { wrapper: makeWrapper([]) });

        await waitFor(() =>
            expect(mockFetchParentCategories).toHaveBeenCalledWith({
                userId: 'user-1',
                userType: 'buyer',
            })
        );
    });

    /**
     * @test Dispatches setCategoryList with API response data on success.
     */
    it('dispatches setCategoryList with returned categories on success', async () => {
        mockFetchParentCategories.mockResolvedValue({ categoryList: mockCategoryList });

        renderHook(() => useGetCategories(), { wrapper: makeWrapper([]) });

        await waitFor(() =>
            expect(mockDispatch).toHaveBeenCalledWith({
                type: 'software/setCategoryList',
                payload: mockCategoryList,
            })
        );
    });

    /**
     * @test Does not call fetchParentCategories when categoryList already has items.
     */
    it('does not fetch when categoryList already has items', async () => {
        renderHook(() => useGetCategories(), {
            wrapper: makeWrapper(mockCategoryList),
        });

        await waitFor(() => expect(mockFetchParentCategories).not.toHaveBeenCalled());
    });

    /**
     * @test isLoading transitions true → false around the API call.
     */
    it('sets isLoading=true during fetch and false after', async () => {
        let resolveApi!: (value: unknown) => void;
        mockFetchParentCategories.mockReturnValueOnce(
            new Promise(res => {
                resolveApi = res;
            })
        );

        const { result } = renderHook(() => useGetCategories(), { wrapper: makeWrapper([]) });

        await waitFor(() => expect(result.current.isLoading).toBe(true));

        resolveApi({ categoryList: mockCategoryList });

        await waitFor(() => expect(result.current.isLoading).toBe(false));
    });

    /**
     * @test Does not dispatch when API returns false.
     */
    it('does not dispatch setCategoryList when API returns false', async () => {
        mockFetchParentCategories.mockResolvedValue(false);

        renderHook(() => useGetCategories(), { wrapper: makeWrapper([]) });

        await waitFor(() => expect(mockFetchParentCategories).toHaveBeenCalled());
        expect(mockDispatch).not.toHaveBeenCalled();
    });
});
