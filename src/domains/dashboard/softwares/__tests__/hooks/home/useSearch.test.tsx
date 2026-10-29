/**
 * @file useSearch.test.tsx
 * @description Unit tests for useSearch hook.
 *
 * Test coverage:
 *  - Returns searchText, handleSearch, getSearchResults on mount
 *  - handleSearch updates searchText with input value
 *  - handleSearch strips emojis from input
 *  - getSearchResults dispatches error toast when searchText is empty
 *  - getSearchResults dispatches error toast when searchText is shorter than 3 chars
 *  - getSearchResults dispatches setQueryParams and navigates on valid input (≥3 chars)
 *  - getSearchResults navigates with query param equal to searchText
 */

import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import useSearch from '../../../hooks/home/useSearch';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

const mockDispatch = vi.fn();
vi.mock('react-redux', async () => {
    const actual = await vi.importActual<typeof import('react-redux')>('react-redux');
    return {
        ...actual,
        useDispatch: () => mockDispatch,
    };
});

const mockShowToast = vi.fn((payload: unknown) => ({ type: 'api/showToast', payload }));
vi.mock('@src/slices/apiSlice', () => ({
    showToast: (payload: unknown) => mockShowToast(payload),
}));

const mockSetQueryParams = vi.fn((payload: unknown) => ({
    type: 'software/setQueryParams',
    payload,
}));
vi.mock('../../../slice/softwareSlice', () => ({
    setQueryParams: (payload: unknown) => mockSetQueryParams(payload),
}));

vi.mock('@utils/regex', () => ({
    removeEmoji: /[\u{1F600}-\u{1F64F}]/gu,
}));

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const buildStore = () =>
    configureStore({
        reducer: { reducer: () => ({}) },
    });

const makeWrapper = () => {
    const store = buildStore();
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
            <MemoryRouter>{children}</MemoryRouter>
        </Provider>
    );
    return Wrapper;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const changeEvent = (value: string) =>
    ({ target: { value } }) as React.ChangeEvent<HTMLInputElement>;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useSearch', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    /**
     * @test Initial state: searchText is empty, functions are returned.
     */
    it('returns searchText as empty string and handler functions on mount', () => {
        const { result } = renderHook(() => useSearch(), { wrapper: makeWrapper() });

        expect(result.current.searchText).toBe('');
        expect(typeof result.current.handleSearch).toBe('function');
        expect(typeof result.current.getSearchResults).toBe('function');
    });

    // -------------------------------------------------------------------------
    // handleSearch
    // -------------------------------------------------------------------------

    /**
     * @test handleSearch updates searchText with the input value.
     */
    it('handleSearch updates searchText with the typed value', () => {
        const { result } = renderHook(() => useSearch(), { wrapper: makeWrapper() });

        act(() => {
            result.current.handleSearch(changeEvent('notion'));
        });

        expect(result.current.searchText).toBe('notion');
    });

    /**
     * @test handleSearch strips emojis from the input value.
     */
    it('handleSearch strips emojis from the input', () => {
        const { result } = renderHook(() => useSearch(), { wrapper: makeWrapper() });

        act(() => {
            result.current.handleSearch(changeEvent('crm😀tool'));
        });

        expect(result.current.searchText).toBe('crmtool');
    });

    // -------------------------------------------------------------------------
    // getSearchResults — validation
    // -------------------------------------------------------------------------

    /**
     * @test Dispatches error toast when searchText is empty.
     */
    it('dispatches error toast when searchText is empty', async () => {
        const { result } = renderHook(() => useSearch(), { wrapper: makeWrapper() });

        await act(async () => {
            await result.current.getSearchResults();
        });

        expect(mockDispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'api/showToast',
                payload: expect.objectContaining({ variant: 'error' }),
            })
        );
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    /**
     * @test Dispatches error toast when searchText has fewer than 3 characters.
     */
    it('dispatches error toast when searchText is shorter than 3 chars', async () => {
        const { result } = renderHook(() => useSearch(), { wrapper: makeWrapper() });

        act(() => {
            result.current.handleSearch(changeEvent('ab'));
        });

        await act(async () => {
            await result.current.getSearchResults();
        });

        expect(mockDispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'api/showToast',
                payload: expect.objectContaining({ variant: 'error' }),
            })
        );
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    /**
     * @test Dispatches error toast when searchText is only whitespace (trim < 3).
     */
    it('dispatches error toast when searchText is only whitespace', async () => {
        const { result } = renderHook(() => useSearch(), { wrapper: makeWrapper() });

        act(() => {
            result.current.handleSearch(changeEvent('   '));
        });

        await act(async () => {
            await result.current.getSearchResults();
        });

        expect(mockDispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'api/showToast',
                payload: expect.objectContaining({ variant: 'error' }),
            })
        );
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    // -------------------------------------------------------------------------
    // getSearchResults — success
    // -------------------------------------------------------------------------

    /**
     * @test Dispatches setQueryParams with search value on valid input.
     */
    it('dispatches setQueryParams with search value when input is valid', async () => {
        const { result } = renderHook(() => useSearch(), { wrapper: makeWrapper() });

        act(() => {
            result.current.handleSearch(changeEvent('slack'));
        });

        await act(async () => {
            await result.current.getSearchResults();
        });

        expect(mockDispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'software/setQueryParams',
                payload: { search: 'slack' },
            })
        );
    });

    /**
     * @test Navigates to search-results with query param on valid input.
     */
    it('navigates to search-results with correct query param on valid input', async () => {
        const { result } = renderHook(() => useSearch(), { wrapper: makeWrapper() });

        act(() => {
            result.current.handleSearch(changeEvent('jira'));
        });

        await act(async () => {
            await result.current.getSearchResults();
        });

        expect(mockNavigate).toHaveBeenCalledWith(
            expect.stringContaining('search-results?query=jira')
        );
    });

    /**
     * @test Does not dispatch toast on valid input.
     */
    it('does not dispatch error toast on valid input', async () => {
        const { result } = renderHook(() => useSearch(), { wrapper: makeWrapper() });

        act(() => {
            result.current.handleSearch(changeEvent('monday'));
        });

        await act(async () => {
            await result.current.getSearchResults();
        });

        expect(mockShowToast).not.toHaveBeenCalled();
    });
});
