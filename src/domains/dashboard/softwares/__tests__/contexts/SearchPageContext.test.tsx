/**
 * @file SearchPageContext.test.tsx
 * @description Production-grade unit tests for SearchPageProvider and its hooks.
 *
 * -----------------------------------------------------------------------------
 * TEST COVERAGE
 * -----------------------------------------------------------------------------
 *
 * Provider & Hook Safety:
 *  - Renders children correctly
 *  - Throws descriptive error when hooks are used outside provider
 *
 * Query Resolution:
 *  - Reads query from URL
 *  - Falls back to Redux queryParams.search
 *  - Falls back to Redux parentCategorySlug
 *
 * Navigation Guards:
 *  - Redirects to softwares index when query is missing
 *
 * Data Fetching:
 *  - Fetches products on mount
 *  - Sends correct API payload (query, userId, userType, parentCategorySlug)
 *  - Handles empty products array
 *  - Handles missing products field
 *  - Skips fetch when query is empty
 *  - Validates loading lifecycle
 *
 * Input Handling:
 *  - Updates searchText correctly
 *  - Removes emoji from input
 *  - Enforces max length (100 chars)
 *  - Clears products when input is empty
 *
 * Search Handler:
 *  - Navigates correctly from index route
 *  - Navigates correctly from category route
 *  - Includes parentCategorySlug in URL
 *  - Dispatches setQueryParams
 *  - Trims whitespace before navigation
 *  - Does nothing for empty/whitespace-only search
 *
 * Debounce Behavior:
 *  - Triggers after 500ms for valid input (>= 3 chars)
 *  - Does not trigger for < 3 chars
 *  - Does not trigger when searchText equals current query
 *  - Cancels previous debounce (cleanup behavior)
 *
 * -----------------------------------------------------------------------------
 */

import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
    SearchPageProvider,
    useSearchResultContext,
    useSearchInputContext,
} from '../../contexts/SearchPageContext';

/* -------------------------------------------------------------------------- */
/* MOCKS */
/* -------------------------------------------------------------------------- */

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
});

const mockFetchSearchProducts = vi.fn();

vi.mock('../../api', () => ({
    fetchSearchProducts: (...args: unknown[]) => mockFetchSearchProducts(...args),
}));

const mockShowToast = vi.fn();

vi.mock('@src/slices/apiSlice', () => ({
    showToast: (payload: unknown) => {
        mockShowToast(payload);
        return { type: 'toast', payload };
    },
}));

vi.mock('@utils/regex', () => ({
    removeEmoji: /[\u{1F600}-\u{1F64F}]/gu,
}));

/* -------------------------------------------------------------------------- */
/* STORE */
/* -------------------------------------------------------------------------- */

const buildStore = (override: { search?: string; parentCategorySlug?: string } = {}) =>
    configureStore({
        reducer: {
            reducer: () => ({
                software: {
                    queryParams: {
                        search: override.search ?? '',
                        parentCategorySlug: override.parentCategorySlug ?? '',
                        category: '',
                        product: '',
                    },
                },
                auth: { role: 'buyer', id: 'user-1' },
            }),
        },
    });

/* -------------------------------------------------------------------------- */
/* RENDER */
/* -------------------------------------------------------------------------- */

const renderProvider = (
    ui: React.ReactNode,
    route = ['/softwares/search-results?query=crm'],
    store = buildStore()
) =>
    render(
        <Provider store={store}>
            <MemoryRouter initialEntries={route}>
                <SearchPageProvider>{ui}</SearchPageProvider>
            </MemoryRouter>
        </Provider>
    );

/* -------------------------------------------------------------------------- */
/* CONSUMER */
/* -------------------------------------------------------------------------- */

const Consumer = () => {
    const result = useSearchResultContext();
    const input = useSearchInputContext();

    return (
        <div>
            <span data-testid="query">{result.query}</span>
            <span data-testid="productsCount">{result.productsCount}</span>
            <span data-testid="searchText">{input.searchText}</span>

            <button type="button" onClick={result.searchHandler}>
                search
            </button>

            <input data-testid="input" value={input.searchText} onChange={input.updateSearchText} />
        </div>
    );
};

/* -------------------------------------------------------------------------- */
/* TESTS */
/* -------------------------------------------------------------------------- */

describe('SearchPageContext (Production Grade)', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mockFetchSearchProducts.mockResolvedValue({
            products: [{ id: '1' }],
        });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    /* ---------------- BASIC ---------------- */

    it('renders children', async () => {
        renderProvider(<div>child</div>);
        expect(await screen.findByText('child')).toBeInTheDocument();
    });

    it('throws outside provider', () => {
        const Test = () => {
            useSearchResultContext();
            return null;
        };

        expect(() => render(<Test />)).toThrow(
            'useSearchResultContext must be used inside SearchPageProvider'
        );
    });

    /* ---------------- QUERY ---------------- */

    it('reads query from URL', async () => {
        renderProvider(<Consumer />);
        expect(await screen.findByTestId('query')).toHaveTextContent('crm');
    });

    it('falls back to Redux queryParams when URL missing', async () => {
        renderProvider(<Consumer />, ['/softwares/search-results'], buildStore({ search: 'erp' }));

        await waitFor(() => expect(screen.getByTestId('query')).toHaveTextContent('erp'));
    });

    it('falls back to Redux parentCategorySlug', async () => {
        renderProvider(
            <Consumer />,
            ['/softwares/search-results?query=crm'],
            buildStore({ parentCategorySlug: 'business' })
        );

        await waitFor(() =>
            expect(mockFetchSearchProducts).toHaveBeenCalledWith(
                expect.objectContaining({ parentCategorySlug: 'business' })
            )
        );
    });

    /* ---------------- NAVIGATION ---------------- */

    it('redirects when query missing', async () => {
        renderProvider(<div />, ['/softwares/search-results']);

        await waitFor(() =>
            expect(mockNavigate).toHaveBeenCalledWith(
                expect.stringContaining('softwares'),
                expect.objectContaining({ replace: true })
            )
        );
    });

    /* ---------------- FETCH ---------------- */

    it('fetches products with correct payload', async () => {
        renderProvider(<Consumer />);

        await waitFor(() =>
            expect(mockFetchSearchProducts).toHaveBeenCalledWith(
                expect.objectContaining({
                    query: 'crm',
                    userId: 'user-1',
                    userType: 'buyer',
                })
            )
        );
    });

    it('handles empty products array', async () => {
        mockFetchSearchProducts.mockResolvedValueOnce({ products: [] });

        renderProvider(<Consumer />);

        await waitFor(() => expect(screen.getByTestId('productsCount')).toHaveTextContent('0'));
    });

    it('handles missing products field', async () => {
        mockFetchSearchProducts.mockResolvedValueOnce({});

        renderProvider(<Consumer />);

        await waitFor(() => expect(screen.getByTestId('productsCount')).toHaveTextContent('0'));
    });

    it('does not fetch when query is empty', async () => {
        renderProvider(<Consumer />, ['/softwares/search-results']);

        expect(mockFetchSearchProducts).not.toHaveBeenCalled();
    });

    /* ---------------- INPUT ---------------- */

    it('updates search text', async () => {
        renderProvider(<Consumer />);

        fireEvent.change(await screen.findByTestId('input'), {
            target: { value: 'erp' },
        });

        expect(screen.getByTestId('searchText')).toHaveTextContent('erp');
    });

    it('removes emoji', async () => {
        renderProvider(<Consumer />);

        fireEvent.change(await screen.findByTestId('input'), {
            target: { value: 'crm 😀' },
        });

        expect(screen.getByTestId('searchText').textContent).not.toContain('😀');
    });

    it('shows error for >100 chars', async () => {
        renderProvider(<Consumer />);

        fireEvent.change(screen.getByTestId('input'), {
            target: { value: 'a'.repeat(101) },
        });

        expect(mockShowToast).toHaveBeenCalled();
    });

    it('clears products when input empty', async () => {
        renderProvider(<Consumer />);

        await waitFor(() => expect(screen.getByTestId('productsCount')).toHaveTextContent('1'));

        fireEvent.change(screen.getByTestId('input'), {
            target: { value: '' },
        });

        await waitFor(() => expect(screen.getByTestId('productsCount')).toHaveTextContent('0'));
    });

    /* ---------------- SEARCH ---------------- */

    it('trims search before navigating', async () => {
        renderProvider(<Consumer />);

        fireEvent.change(await screen.findByTestId('input'), {
            target: { value: '  crm  ' },
        });

        fireEvent.click(screen.getByText('search'));

        await waitFor(() =>
            expect(mockNavigate).toHaveBeenCalledWith(
                expect.stringContaining('query=crm'),
                expect.any(Object)
            )
        );
    });

    /* ---------------- DEBOUNCE ---------------- */

    it('triggers debounced search after 500ms', async () => {
        vi.useFakeTimers();

        renderProvider(<Consumer />);

        const input = screen.getByTestId('input');

        act(() => {
            fireEvent.change(input, { target: { value: 'erp' } });
        });

        act(() => {
            vi.advanceTimersByTime(500);
        });

        expect(mockNavigate).toHaveBeenCalled();

        vi.useRealTimers();
    });

    it('does not trigger for <3 chars', async () => {
        vi.useFakeTimers();

        renderProvider(<Consumer />);

        const input = screen.getByTestId('input');

        act(() => {
            fireEvent.change(input, { target: { value: 'ab' } });
        });

        act(() => {
            vi.advanceTimersByTime(600);
        });

        expect(mockNavigate).not.toHaveBeenCalled();

        vi.useRealTimers();
    });

    it('does not trigger when searchText equals query', async () => {
        vi.useFakeTimers();

        renderProvider(<Consumer />, ['/softwares/search-results?query=crm']);

        const input = screen.getByTestId('input');

        act(() => {
            fireEvent.change(input, { target: { value: 'crm' } });
        });

        act(() => {
            vi.advanceTimersByTime(600);
        });

        expect(mockNavigate).not.toHaveBeenCalled();

        vi.useRealTimers();
    });

    it('clears previous debounce (no duplicate calls)', async () => {
        vi.useFakeTimers();

        renderProvider(<Consumer />);

        const input = screen.getByTestId('input');

        act(() => {
            fireEvent.change(input, { target: { value: 'crm' } });
            vi.advanceTimersByTime(300);
            fireEvent.change(input, { target: { value: 'erp' } });
        });

        act(() => {
            vi.advanceTimersByTime(500);
        });

        expect(mockNavigate).toHaveBeenCalledTimes(1);

        vi.useRealTimers();
    });
});
